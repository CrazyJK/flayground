import FlayStorage from '@lib/FlayStorage';
import themeSVG from '@svg/themes';
import './ThemeController.scss';

/** 테마 타입 */
type ThemeType = 'os' | 'light' | 'dark';

const THEME_KEY = 'FlayNav.theme';
const OS: ThemeType = 'os';
const LIGHT: ThemeType = 'light';
const DARK: ThemeType = 'dark';

/**
 * 테마 변경을 관리하는 컨트롤러 컴포넌트
 * - OS 테마, 라이트 테마, 다크 테마 지원
 * - 로컬 스토리지에 테마 설정 저장
 * - 시스템 테마 변경 감지
 */
export default class ThemeController extends HTMLElement {
  /** 현재 테마 */
  theme: ThemeType = OS;
  /** 다크 모드 여부 */
  isDark: boolean = false;
  /** 미디어 쿼리 리스트 */
  mediaQueryList: MediaQueryList | null = null;

  constructor() {
    super();
    this.classList.add('theme-controller', 'flay-div');

    const themeGroup = this.appendChild(document.createElement('div'));
    themeGroup.classList.add('theme-group');
    [OS, LIGHT, DARK].forEach((theme: ThemeType) => {
      const radio = themeGroup.appendChild(document.createElement('input'));
      radio.type = 'radio';
      radio.id = 'theme' + theme;
      radio.name = 'theme';
      radio.value = theme;
      radio.title = theme;

      const label = themeGroup.appendChild(document.createElement('label'));
      label.setAttribute('for', 'theme' + theme);
      label.innerHTML = themeSVG[theme];
      label.addEventListener('click', () => {
        FlayStorage.local.set(THEME_KEY, theme);
        console.debug('set Storage Theme', theme);

        this.theme = theme;
        this.applyTheme();
      });
    });
  }

  connectedCallback(): void {
    const storedTheme = FlayStorage.local.get(THEME_KEY, OS) as string;
    this.theme = this.isValidTheme(storedTheme) ? storedTheme : OS;
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

    this.onThemeListener();
    this.applyTheme();
  }

  /**
   * 유효한 테마인지 확인합니다.
   */
  private isValidTheme(theme: string): theme is ThemeType {
    return theme === OS || theme === LIGHT || theme === DARK;
  }

  onThemeListener(): void {
    // storage 변경에 대한 리스너 등록
    window.onstorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) {
        console.debug('[onThemeListener] onstorage', e.key, e.oldValue, e.newValue);
        if (this.isValidTheme(e.newValue)) {
          this.theme = e.newValue;
          this.applyTheme();
        }
      }
    };
    // os 테마 변경에 대한 리스너 등록
    this.mediaQueryList?.addEventListener('change', () => {
      console.debug('[onThemeListener] mediaQuery', this.mediaQueryList);
      if (this.theme === OS) {
        this.applyTheme();
      }
    });
  }

  applyTheme(): void {
    if (this.theme === OS) {
      this.isDark = this.mediaQueryList?.matches ?? false;
    } else {
      this.isDark = this.theme === DARK;
    }
    console.debug('[applyTheme] theme', this.theme, 'isDark', this.isDark);

    const radioInput = this.querySelector('input#theme' + this.theme) as HTMLInputElement;
    if (radioInput) {
      radioInput.checked = true;
    }
    document.documentElement.setAttribute('theme', this.isDark ? DARK : LIGHT);
  }
}

// Define the new element
customElements.define('theme-controller', ThemeController);
