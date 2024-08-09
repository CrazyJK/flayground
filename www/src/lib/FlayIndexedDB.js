// https://developer.mozilla.org/ko/docs/Web/API/IndexedDB_API/Using_IndexedDB

export default class FlayDB {
  db;

  constructor() {}

  open(dbName, dbVersion, dbSchema) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onsuccess = (e) => {
        this.db = e.target.result;
        console.log('[FlayDB] open', e);
        resolve();
      };
      req.onerror = (e) => {
        console.error('[FlayDB] open Error', e);
        reject(e.target.error);
      };
      req.onupgradeneeded = (e) => {
        console.log('[FlayDB] open onupgradeneeded', this.dbSchema, e);

        Array.from(dbSchema).forEach((schema) => {
          const store = e.currentTarget.result.createObjectStore(schema.name, { keyPath: schema.keyPath });
          Array.from(schema.index).forEach((index) => {
            store.createIndex(index.key, index.key, { unique: index.unique });
          });
        });
      };
    });
  }

  #getStore(storeName, mode = 'readonly') {
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  #reqSuccessVoidHandler(resolve, storeName, command, e, ...args) {
    console.debug('[FlayDB]', storeName, command, e, ...args);
    resolve();
  }

  #reqErrorHandler(reject, storeName, command, e, ...args) {
    console.error('[FlayDB]', storeName, command, e.target.error, e, ...args);
    reject(e.target.error);
  }

  get(storeName, key) {
    return new Promise((resolve, reject) => {
      const req = this.#getStore(storeName).get(key);
      req.onsuccess = (e) => {
        const record = e.target.result;
        console.debug('[FlayDB]', storeName, 'get', key, record, e);
        resolve(record);
      };
      req.onerror = (e) => this.#reqErrorHandler(reject, storeName, 'get', e, key);
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

// (async () => {
//   const DB_NAME = 'flay-ground-db';
//   const DB_VERSION = 3; // Use a long long for this value (don't use a float)

//   const DB_STORE_NAME = 'FlayPlayTime';

//   const schema = [{ name: 'FlayPlayTime', keyPath: 'opus', index: [{ key: 'time', unique: false }] }];

//   const db = new FlayDB();
//   await db.open(DB_NAME, DB_VERSION, schema);

//   await db.put(DB_STORE_NAME, { opus: 'asdf', time: 2 });

//   await db.get(DB_STORE_NAME, 'asdfx');

//   await db.delete(DB_STORE_NAME, 'asdf');

//   await db.add(DB_STORE_NAME, { opus: 'asdf', time: 42 });

//   await db.clear(DB_STORE_NAME);
// })();
