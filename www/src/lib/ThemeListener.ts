import FlayStorage from '@lib/FlayStorage';

// 테마 타입 정의
type ThemeSetting = 'os' | 'light' | 'dark';
type ThemeValue = 'light' | 'dark';

// 테마 상수 정의
const THEME_KEY = 'FlayNav.theme';
const OS: ThemeSetting = 'os';
const LIGHT: ThemeValue = 'light';
const DARK: ThemeValue = 'dark';

// 시스템 다크 모드 감지를 위한 미디어 쿼리
const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

// 상태 변수
let theme: ThemeSetting = FlayStorage.local.get(THEME_KEY, OS) as ThemeSetting;
let isDark = false;

/**
 * 스토리지 테마 변경 리스너
 * 다른 탭/창에서 테마 변경 시 동기화
 */
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === THEME_KEY && e.newValue) {
    console.debug('storage event', e.key, e.oldValue, e.newValue);
    // 유효한 테마값인지 검증 후 설정
    if ([OS, LIGHT, DARK].includes(e.newValue as ThemeSetting)) {
      theme = e.newValue as ThemeSetting;
      applyTheme();
    }
  }
});

/**
 * 시스템 테마 변경 리스너
 */
darkMediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
  if (theme === OS) {
    console.debug('System theme changed:', e.matches ? DARK : LIGHT);
    applyTheme();
  }
});

/**
 * 현재 테마 설정에 따라 다크/라이트 모드 적용
 */
const applyTheme = (): ThemeValue => {
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
 * @param newTheme - 설정할 테마 ('os', 'light', 'dark')
 * @returns 적용된 테마
 */
const setTheme = (newTheme: ThemeSetting): ThemeValue => {
  theme = newTheme;
  FlayStorage.local.set(THEME_KEY, theme);
  return applyTheme();
};

/**
 * 현재 테마 값 반환 함수
 * @returns 현재 테마 (DARK 또는 LIGHT)
 */
const getCurrentTheme = (): ThemeValue => {
  return isDark ? DARK : LIGHT;
};

/**
 * 테마 설정 값 반환 함수 (OS, LIGHT, DARK)
 * @returns 테마 설정 값
 */
const getThemeSetting = (): ThemeSetting => {
  return theme;
};

/**
 * 테마 토글 함수 (라이트 ↔ 다크)
 * @returns 토글 후 적용된 테마
 */
const toggleTheme = (): ThemeValue => {
  const newTheme: ThemeSetting = isDark ? LIGHT : DARK;
  return setTheme(newTheme);
};

/**
 * 현재 다크 모드인지 확인
 * @returns 다크 모드이면 true
 */
const isDarkMode = (): boolean => {
  return isDark;
};

/**
 * 시스템 테마 모드인지 확인
 * @returns 시스템 테마 모드이면 true
 */
const isSystemTheme = (): boolean => {
  return theme === OS;
};

// 초기 테마 적용
applyTheme();

// 모듈 내보내기
export { DARK, getCurrentTheme, getThemeSetting, isDarkMode, isSystemTheme, LIGHT, OS, setTheme, toggleTheme };

export default {
  OS,
  LIGHT,
  DARK,
  setTheme,
  getCurrentTheme,
  getThemeSetting,
  toggleTheme,
  isDarkMode,
  isSystemTheme,
};
