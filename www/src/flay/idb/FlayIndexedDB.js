// https://developer.mozilla.org/ko/docs/Web/API/IndexedDB_API/Using_IndexedDB

export default class FlayIndexedDB {
  #db;
  isDebug = false;

  constructor(isDebug) {
    this.isDebug = isDebug;
  }

  open(dbName, dbVersion, dbSchema) {
    if (this.#db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onsuccess = (e) => {
        this.#db = e.target.result;
        console.debug('[FlayIndexedDB] open', dbName, dbVersion, e);
        resolve();
      };
      req.onerror = (e) => {
        console.error('[FlayIndexedDB] open Error', dbName, dbVersion, e);
        reject(e.target.error);
      };
      req.onupgradeneeded = (e) => {
        console.log('[FlayIndexedDB] open onupgradeneeded', dbName, dbVersion, e);
        Array.from(e.currentTarget.result.objectStoreNames).forEach((storeName) => {
          e.currentTarget.result.deleteObjectStore(storeName);
        });
        Array.from(dbSchema).forEach((schema) => {
          const store = e.currentTarget.result.createObjectStore(schema.name, { keyPath: schema.keyPath });
          schema.index &&
            Array.from(schema.index).forEach((index) => {
              store.createIndex(index.key, index.key, { unique: index.unique });
            });
        });
      };
    });
  }

  #getStore(storeName, mode = 'readonly') {
    return this.#db.transaction(storeName, mode).objectStore(storeName);
  }

  #reqSuccessVoidHandler(resolve, storeName, command, e, ...args) {
    this.isDebug && console.debug('[FlayIndexedDB]', storeName, command, e, ...args);
    resolve();
  }

  #reqErrorHandler(reject, storeName, command, e, ...args) {
    console.error('[FlayIndexedDB]', storeName, command, e.target.error, e, ...args);
    reject(e.target.error);
  }

  get(storeName, key) {
    return new Promise((resolve, reject) => {
      const req = this.#getStore(storeName).get(key);
      req.onsuccess = (e) => {
        const record = e.target.result;
        this.isDebug && console.debug('[FlayIndexedDB]', storeName, 'get', key, record, e);
        resolve(record);
      };
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'get', e, key);
    });
  }

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const list = [];
      const req = this.#getStore(storeName).openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
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

  getAllByIndex(storeName, indexName, ascending = true) {
    return new Promise((resolve, reject) => {
      const list = [];
      const req = this.#getStore(storeName)
        .index(indexName)
        .openCursor(null, ascending ? 'next' : 'prev');
      req.onsuccess = (e) => {
        const cursor = e.target.result;
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

  find(storeName, key, value) {
    return new Promise((resolve, reject) => {
      const flayList = [];
      const req = this.#getStore(storeName).index(key).openCursor(IDBKeyRange.only(value));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
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

  findLike(storeName, key, value) {
    return new Promise((resolve, reject) => {
      const flayList = [];
      const req = this.#getStore(storeName).index(key).openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value[key].includes(value)) {
            flayList.push(cursor.value);
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

  add(storeName, record) {
    return new Promise((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').add(record);
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'add', e, record);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'add', e, record);
    });
  }

  put(storeName, record) {
    return new Promise((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').put(record);
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'put', e, record);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'put', e, record);
    });
  }

  delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').delete(key);
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'delete', e, key);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'delete', e, key);
    });
  }

  clear(storeName) {
    return new Promise((resolve, reject) => {
      const req = this.#getStore(storeName, 'readwrite').clear();
      req.onsuccess = (e) => this.#reqSuccessVoidHandler(resolve, storeName, 'clear', e);
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'clear', e);
    });
  }
}
