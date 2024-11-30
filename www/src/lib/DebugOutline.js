import FlayStorage from './FlayStorage';

const DEBUG_KEY = 'debug.web';

let debugValue = FlayStorage.local.getNumber(DEBUG_KEY, 0);

document.documentElement.setAttribute('debug', debugValue);

export const toggleDebug = () => {
  debugValue = ++debugValue % 3;
  document.documentElement.setAttribute('debug', debugValue);
  FlayStorage.local.set(DEBUG_KEY, debugValue);
};
