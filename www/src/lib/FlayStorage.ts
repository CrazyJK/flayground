// 스토리지 유틸리티 인터페이스 정의
interface StorageUtil {
  set: (name: string, value: string) => void;
  setObject: (name: string, object: unknown) => void;
  setArray: (name: string, array: string[]) => void;
  get: (name: string, defaultValue?: string) => string;
  getObject: <T = unknown>(name: string, defaultValue?: T) => T;
  getArray: (name: string, defaultValue?: string[]) => string[];
  getNumber: (name: string, defaultValue?: number) => number;
  getBoolean: (name: string, defaultValue?: boolean) => boolean;
  remove: (name: string) => void;
  clear: () => void;
}

// 스토리지 타입 정의
type StorageType = 'local' | 'session';

// 스토리지 타입에 따라 동작하는 유틸리티 함수를 생성하는 팩토리 함수
const createStorageUtil = (storageType: StorageType): StorageUtil => {
  const storage = storageType === 'local' ? localStorage : sessionStorage;

  return {
    set: (name: string, value: string): void => {
      storage.setItem(name, value);
    },
    setObject: (name: string, object: unknown): void => {
      storage.setItem(name, JSON.stringify(object));
    },
    setArray: (name: string, array: string[]): void => {
      storage.setItem(name, array.join(','));
    },
    get: (name: string, defaultValue: string = ''): string => {
      const value = storage.getItem(name);
      return value !== null ? value : defaultValue;
    },
    getObject: <T = unknown>(name: string, defaultValue: T = {} as T): T => {
      try {
        const value = storage.getItem(name);
        return value !== null ? JSON.parse(value) : defaultValue;
      } catch (e) {
        console.error(`Error parsing JSON from ${storageType} storage:`, e);
        return defaultValue;
      }
    },
    getArray: (name: string, defaultValue: string[] = []): string[] => {
      const value = storage.getItem(name);
      return value !== null && value !== '' ? value.split(',') : defaultValue;
    },
    getNumber: (name: string, defaultValue: number = 0): number => {
      const value = storage.getItem(name);
      const num = value !== null ? Number(value) : NaN;
      return !isNaN(num) ? num : defaultValue;
    },
    getBoolean: (name: string, defaultValue: boolean = false): boolean => {
      const value = storage.getItem(name);
      if (value === null) return defaultValue;
      return value === 'true' || value === 'on' || value === 'yes' || value === 'Y';
    },
    remove: (name: string): void => {
      storage.removeItem(name);
    },
    clear: (): void => {
      storage.clear();
    },
  };
};

const FlayStorage = {
  local: createStorageUtil('local'),
  session: createStorageUtil('session'),

  // 편의 메서드 추가
  isStorageAvailable: (type: StorageType): boolean => {
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
