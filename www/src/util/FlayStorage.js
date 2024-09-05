const FlayStorage = {
  local: {
    set: (name, value) => {
      localStorage.setItem(name, value);
    },
    setObject: (name, object) => {
      FlayStorage.local.set(name, JSON.stringify(object));
    },
    get: (name, defaultValue) => {
      let value = localStorage.getItem(name);
      return value !== null ? value : defaultValue ? defaultValue : '';
    },
    getNumber: (name, defaultValue) => {
      return Number(FlayStorage.local.get(name, defaultValue));
    },
    getBoolean: (name, defaultValue) => {
      let value = FlayStorage.local.get(name, defaultValue);
      return value === true || value === 'true' || value === 'on' || value === 'yes' || value === 'Y';
    },
    getArray: (name, defaultValue) => {
      return FlayStorage.local.get(name, defaultValue).split(',');
    },
    getObject: (name, defaultValue) => {
      return JSON.parse(FlayStorage.local.get(name, defaultValue));
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
    get: (name, defaultValue) => {
      let value = sessionStorage.getItem(name);
      return value !== null ? value : defaultValue ? defaultValue : '';
    },
    getNumber: (name, defaultValue) => {
      return Number(FlayStorage.session.get(name, defaultValue));
    },
    getBoolean: (name, defaultValue) => {
      let value = FlayStorage.session.get(name, defaultValue);
      return value === true || value === 'true' || value === 'on' || value === 'yes' || value === 'Y';
    },
    getArray: (name, defaultValue) => {
      return FlayStorage.session.get(name, defaultValue).split(',');
    },
    getObject: (name, defaultValue) => {
      let value = FlayStorage.session.get(name, defaultValue);
      return value === null || value === '' ? defaultValue : JSON.parse(value);
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
