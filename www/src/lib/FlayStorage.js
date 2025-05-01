// 스토리지 타입에 따라 동작하는 유틸리티 함수를 생성하는 팩토리 함수
const createStorageUtil = (storageType) => {
  const storage = storageType === 'local' ? localStorage : sessionStorage;

  return {
    set: (name, value) => {
      storage.setItem(name, value);
    },
    setObject: (name, object) => {
      storage.setItem(name, JSON.stringify(object));
    },
    setArray: (name, array) => {
      storage.setItem(name, array.join(','));
    },
    get: (name, defaultValue = '') => {
      const value = storage.getItem(name);
      return value !== null ? value : defaultValue;
    },
    getObject: (name, defaultValue = {}) => {
      try {
        const value = storage.getItem(name);
        return value !== null ? JSON.parse(value) : defaultValue;
      } catch (e) {
        console.error(`Error parsing JSON from ${storageType} storage:`, e);
        return defaultValue;
      }
    },
    getArray: (name, defaultValue = []) => {
      const value = storage.getItem(name);
      return value !== null && value !== '' ? value.split(',') : defaultValue;
    },
    getNumber: (name, defaultValue = 0) => {
      const value = storage.getItem(name);
      const num = value !== null ? Number(value) : NaN;
      return !isNaN(num) ? num : defaultValue;
    },
    getBoolean: (name, defaultValue = false) => {
      const value = storage.getItem(name);
      if (value === null) return defaultValue;
      return value === 'true' || value === 'on' || value === 'yes' || value === 'Y';
    },
    remove: (name) => {
      storage.removeItem(name);
    },
    clear: () => {
      storage.clear();
    },
  };
};

const FlayStorage = {
  local: createStorageUtil('local'),
  session: createStorageUtil('session'),

  // 편의 메서드 추가
  isStorageAvailable: (type) => {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export default FlayStorage;
