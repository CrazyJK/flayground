import FlayStorage from './FlayStorage';

const DEBUG_KEY = 'debug.web';

let debugValue: number = FlayStorage.local.getNumber(DEBUG_KEY, 0);

document.documentElement.setAttribute('debug', debugValue.toString());

export const toggleDebug = (): void => {
  debugValue = ++debugValue % 3;
  document.documentElement.setAttribute('debug', debugValue.toString());
  FlayStorage.local.set(DEBUG_KEY, debugValue.toString());
};
