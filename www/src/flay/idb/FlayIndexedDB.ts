// https://developer.mozilla.org/ko/docs/Web/API/IndexedDB_API/Using_IndexedDB

interface IndexSchema {
  key: string;
  unique: boolean;
}

interface StoreSchema {
  name: string;
  keyPath: string;
  index?: IndexSchema[];
}

export default class FlayIndexedDB {
  #db: IDBDatabase | null = null;
  isDebug: boolean = false;

  constructor(isDebug: boolean = false) {
    this.isDebug = isDebug;
  }

  open(dbName: string, dbVersion: number, dbSchema: StoreSchema[]): Promise<void> {
    if (this.#db) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onsuccess = (e) => {
        this.#db = (e.target as IDBRequest).result;
        console.debug('[FlayIndexedDB] open', dbName, dbVersion, e);
        resolve();
      };
      req.onerror = (e) => {
        console.error('[FlayIndexedDB] open Error', dbName, dbVersion, e);
        reject((e.target as IDBRequest).error);
      };
      req.onupgradeneeded = (e) => {
        console.log('[FlayIndexedDB] open onupgradeneeded', dbName, dbVersion, e);
        const db = (e.currentTarget as IDBRequest).result as IDBDatabase;
        Array.from(db.objectStoreNames).forEach((storeName) => {
          db.deleteObjectStore(storeName);
        });
        dbSchema.forEach((schema) => {
          const store = db.createObjectStore(schema.name, { keyPath: schema.keyPath });
          schema.index &&
            schema.index.forEach((index) => {
              store.createIndex(index.key, index.key, { unique: index.unique });
            });
        });
      };
    });
  }

  #getStore(storeName: string, mode: 'readonly' | 'readwrite' = 'readonly'): IDBObjectStore {
    return this.#db!.transaction(storeName, mode).objectStore(storeName);
  }

  #reqSuccessVoidHandler(resolve: () => void, storeName: string, command: string, e: Event, ...args: unknown[]): void {
    this.isDebug && console.debug('[FlayIndexedDB]', storeName, command, e, ...args);
    resolve();
  }

  #reqErrorHandler(reject: (error: unknown) => void, storeName: string, command: string, e: Event, ...args: unknown[]): void {
    console.error('[FlayIndexedDB]', storeName, command, (e.target as IDBRequest).error, e, ...args);
    reject((e.target as IDBRequest).error);
  }

  get<T = unknown>(storeName: string, key: string | number): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve, reject) => {
      const req = this.#getStore(storeName).get(key);
      req.onsuccess = (e) => {
        const record = (e.target as IDBRequest<T>).result;
        this.isDebug && console.debug('[FlayIndexedDB]', storeName, 'get', key, record, e);
        resolve(record);
      };
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'get', e, key);
    });
  }

  getAll<T = unknown>(storeName: string): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const list: T[] = [];
      const req = this.#getStore(storeName).openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          this.isDebug && console.debug('getAll', list.length);
          resolve(list);
        }
      };
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'getAll', e);
    });
  }

  getAllByIndex<T = unknown>(storeName: string, indexName: string, ascending: boolean = true): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const list: T[] = [];
      const req = this.#getStore(storeName)
        .index(indexName)
        .openCursor(null, ascending ? 'next' : 'prev');
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          this.isDebug && console.debug('getAllByIndex', list.length);
          resolve(list);
        }
      };
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'getAll', e);
    });
  }

  find<T = unknown>(storeName: string, key: string, value: string | number): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const flayList: T[] = [];
      const req = this.#getStore(storeName).index(key).openCursor(IDBKeyRange.only(value));
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          flayList.push(cursor.value);
          cursor.continue();
        } else {
          this.isDebug && console.debug('find', key, value, flayList.length);
          resolve(flayList);
        }
      };
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'find', e, key);
    });
  }

  findLike<T = Record<string, unknown>>(storeName: string, key: string, value: string): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const flayList: T[] = [];
      const req = this.#getStore(storeName).index(key).openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const record = cursor.value as T;
          if (record[key] && typeof record[key] === 'string' && record[key].includes(value)) {
            flayList.push(record);
          }
          cursor.continue();
        } else {
          this.isDebug && console.debug('find', key, value, flayList.length);
          resolve(flayList);
        }
      };
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'find', e, key);
    });
  }

  add<T = unknown>(storeName: string, record: T): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').add(record);
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'add', e, record);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'add', e, record);
    });
  }

  put<T = unknown>(storeName: string, record: T): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').put(record);
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'put', e, record);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'put', e, record);
    });
  }

  delete(storeName: string, key: string | number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').delete(key);
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'delete', e, key);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'delete', e, key);
    });
  }

  clear(storeName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').clear();
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'clear', e);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'clear', e);
    });
  }
}
