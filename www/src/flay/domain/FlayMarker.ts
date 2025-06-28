import ApiClient from '@lib/ApiClient';
import { Flay } from '@lib/FlayFetch';
import { popupFlay } from '@lib/FlaySearch';
import favorite from '@svg/favorite';
import ranks from '@svg/ranks';
import './FlayMarker.scss';

/** FlayMarker 컴포넌트 옵션 */
export interface FlayMarkerOptions {
  /** 제목 툴팁 표시 여부 */
  showTitle: boolean;
  /** 커버 이미지 표시 여부 */
  showCover: boolean;
  /** 마커 모양 */
  shape: 'square' | 'circle' | 'star' | 'heart' | 'rhombus';
}

/** 기본 옵션 */
const DEFAULT_OPTIONS: FlayMarkerOptions = {
  showTitle: true,
  showCover: false,
  shape: 'square',
};

/**
 * Flay 정보를 표시하는 마커 컴포넌트
 * - 다양한 모양 지원 (square, circle, star, heart, rhombus)
 * - 클릭 시 Flay 팝업 표시
 * - 호버 시 커버 이미지 표시 옵션
 */
export default class FlayMarker extends HTMLLabelElement {
  /** Flay 데이터 */
  flay: Flay;

  /**
   * FlayMarker 생성자
   * @param flay Flay 데이터
   * @param options 마커 옵션
   */
  constructor(flay: Flay, options: Partial<FlayMarkerOptions> = {}) {
    super();

    const mergedOptions: FlayMarkerOptions = { ...DEFAULT_OPTIONS, ...options };

    this.flay = flay;
    this.classList.add('flay-marker');
    this.classList.toggle('shot', flay.video.likes?.length > 0);
    this.classList.toggle('archive', flay.archive);
    this.addEventListener('click', () => {
      popupFlay(flay.opus);
      this.classList.add('active');
    });

    if (mergedOptions.showCover) {
      this.addEventListener('mouseover', () => this.showCover(), { once: true });
    }
    if (mergedOptions.showTitle) {
      this.title = `${flay.studio}\n${flay.opus}\n${flay.title}\n${flay.actressList.join(', ')}\n${flay.release}`;
    }

    this.classList.add(mergedOptions.shape);
    if (mergedOptions.shape === 'heart') {
      this.innerHTML = favorite;
    } else if (mergedOptions.shape === 'star') {
      this.innerHTML = ranks[flay.video.rank + 1];
    }
  }

  /**
   * 커버 이미지를 배경으로 표시합니다.
   */
  showCover(): void {
    this.classList.add('cover');
    this.style.backgroundImage = `url(${ApiClient.buildUrl(`/static/cover/${this.flay.opus}`)})`;
  }
}

customElements.define('flay-marker', FlayMarker, { extends: 'label' });
