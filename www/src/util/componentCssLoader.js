import componentCss from 'raw-loader!../style/component.css';

/**
 * 공통 style 추가
 */
export function appendStyle() {
  document.querySelector('head').appendChild(document.createElement('style')).innerHTML = componentCss;
}

/**
 * 공통 style
 */
export { componentCss };
