import FlayStorage from './FlayStorage';

// 테마 상수 정의
const THEME_KEY = 'FlayNav.theme';
const OS = 'os';
const LIGHT = 'light';
const DARK = 'dark';

// 시스템 다크 모드 감지를 위한 미디어 쿼리
const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// 상태 변수
let theme = FlayStorage.local.get(THEME_KEY, OS);
let isDark;

/**
 * 스토리지 테마 변경 리스너
 * 다른 탭/창에서 테마 변경 시 동기화
 */
window.addEventListener('storage', (e) => {
  if (e.key === THEME_KEY) {
    console.debug('storage event', e.key, e.oldValue, e.newValue);
    theme = e.newValue;
    applyTheme();
  }
});

/**
 * 시스템 테마 변경 리스너
 */
darkMediaQuery.addEventListener('change', (e) => {
  if (theme === OS) {
    console.debug('System theme changed:', e.matches ? DARK : LIGHT);
    applyTheme();
  }
});

/**
 * 현재 테마 설정에 따라 다크/라이트 모드 적용
 */
const applyTheme = () => {
  if (theme === OS) {
    isDark = darkMediaQuery.matches;
  } else {
    isDark = theme === DARK;
  }

  document.documentElement.setAttribute('theme', isDark ? DARK : LIGHT);
  return isDark ? DARK : LIGHT;
};

/**
 * 테마 변경 함수
 * @param {string} newTheme - 설정할 테마 ('os', 'light', 'dark')
 * @returns {string} 적용된 테마
 */
const setTheme = (newTheme) => {
  if (![OS, LIGHT, DARK].includes(newTheme)) {
    console.error('Invalid theme:', newTheme);
    return getCurrentTheme();
  }

  theme = newTheme;
  FlayStorage.local.set(THEME_KEY, theme);
  return applyTheme();
};

/**
 * 현재 테마 값 반환 함수
 * @returns {string} 현재 테마 (DARK 또는 LIGHT)
 */
const getCurrentTheme = () => {
  return isDark ? DARK : LIGHT;
};

/**
 * 테마 설정 값 반환 함수 (OS, LIGHT, DARK)
 * @returns {string} 테마 설정 값
 */
const getThemeSetting = () => {
  return theme;
};

/**
 * 테마 토글 함수 (라이트 ↔ 다크)
 * @returns {string} 토글 후 적용된 테마
 */
const toggleTheme = () => {
  const newTheme = isDark ? LIGHT : DARK;
  return setTheme(newTheme);
};

// 초기 테마 적용
applyTheme();

// 모듈 내보내기
export { DARK, getCurrentTheme, getThemeSetting, LIGHT, OS, setTheme, toggleTheme };

export default {
  OS,
  LIGHT,
  DARK,
  setTheme,
  getCurrentTheme,
  getThemeSetting,
  toggleTheme,
};
