const FlayStorage = {
  local: {
    set: (name, value) => {
      localStorage.setItem(name, value);
    },
    setObject: (name, object) => {
      FlayStorage.local.set(name, JSON.stringify(object));
    },
    setArray: (name, array) => {
      FlayStorage.local.set(name, array.join(','));
    },
    get: (name, defaultValue = '') => {
      let value = localStorage.getItem(name);
      return value !== null ? value : defaultValue;
    },
    getObject: (name, defaultValue = {}) => {
      return JSON.parse(FlayStorage.local.get(name, null)) || defaultValue;
    },
    getArray: (name, defaultValue = []) => {
      return FlayStorage.local.get(name)?.split(',') || defaultValue;
    },
    getNumber: (name, defaultValue) => {
      return Number(FlayStorage.local.get(name)) || defaultValue;
    },
    getBoolean: (name, defaultValue) => {
      const value = FlayStorage.local.get(name, defaultValue);
      return value === true || value === 'true' || value === 'on' || value === 'yes' || value === 'Y';
    },
    remove: (name) => {
      localStorage.removeItem(name);
    },
    clear: () => {
      localStorage.clear();
    },
  },
  session: {
    set: (name, value) => {
      sessionStorage.setItem(name, value);
    },
    setObject: (name, object) => {
      FlayStorage.session.set(name, JSON.stringify(object));
    },
    setArray: (name, array) => {
      FlayStorage.session.set(name, array.join(','));
    },
    get: (name, defaultValue = '') => {
      let value = sessionStorage.getItem(name);
      return value !== null ? value : defaultValue;
    },
    getObject: (name, defaultValue = {}) => {
      return JSON.parse(FlayStorage.session.get(name, null)) || defaultValue;
    },
    getArray: (name, defaultValue = []) => {
      return FlayStorage.session.get(name)?.split(',') || defaultValue;
    },
    getNumber: (name, defaultValue) => {
      return Number(FlayStorage.session.get(name)) || defaultValue;
    },
    getBoolean: (name, defaultValue) => {
      const value = FlayStorage.session.get(name, defaultValue);
      return value === true || value === 'true' || value === 'on' || value === 'yes' || value === 'Y';
    },
    remove: (name) => {
      sessionStorage.removeItem(name);
    },
    clear: () => {
      sessionStorage.clear();
    },
  },
};

export default FlayStorage;
