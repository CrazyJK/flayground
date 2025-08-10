import { FlayTooltip } from '@flay/domain/FlayTooltip';
import ApiClient from '@lib/ApiClient';
import { Flay } from '@lib/FlayFetch';
import { popupFlay } from '@lib/FlaySearch';
import StyleUtils from '@lib/StyleUtils';
import favorite from '@svg/favorite';
import ranks from '@svg/ranks';
import './FlayMarker.scss';

export type ShapeType = 'square' | 'circle' | 'star' | 'heart' | 'rhombus';

export const SHAPES: ShapeType[] = ['square', 'circle', 'star', 'heart', 'rhombus'];

/** FlayMarker 컴포넌트 옵션 */
export interface FlayMarkerOptions {
  /** Flay 툴팁 표시 여부 */
  tooltip: boolean;
  /** 마커 모양 */
  shape: ShapeType;
  /** Cover 표시 여부 */
  cover?: boolean; // show cover image
}

/** 기본 옵션 */
const DEFAULT_OPTIONS: FlayMarkerOptions = {
  tooltip: false,
  shape: 'square',
  cover: false,
} as const;

/**
 * Flay 정보를 표시하는 마커 컴포넌트
 * - 다양한 모양 지원 (square, circle, star, heart, rhombus)
 * - 클릭 시 Flay 팝업 표시
 * - 호버 시 툴팁 표시 옵션
 */
export default class FlayMarker extends HTMLElement {
  /** Flay 데이터 */
  flay: Flay = {} as Flay;
  #options: FlayMarkerOptions = { ...DEFAULT_OPTIONS };

  /**
   * FlayMarker 생성자
   * @param flay Flay 데이터
   * @param options 마커 옵션
   */
  constructor(flay: Flay, options: Partial<FlayMarkerOptions> = {}) {
    super();

    this.set(flay, options);
  }

  connectedCallback(): void {
    this.addEventListener('click', this.#popupFlayHandler.bind(this));
    this.addEventListener('mouseover', this.#showTooltipHandler.bind(this));
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.#popupFlayHandler.bind(this));
    this.removeEventListener('mouseover', this.#showTooltipHandler.bind(this));
    this.clear();
  }

  clear(): void {
    this.flay = {} as Flay;
    this.#options = { ...DEFAULT_OPTIONS };
    this.classList.remove(...SHAPES);
    this.classList.remove('active', 'shot', 'archive');
    this.title = '';
    document.querySelector('.flay-tooltip')?.remove(); // Remove existing tooltip
  }

  set(flay: Flay, options: Partial<FlayMarkerOptions> = {}): void {
    this.clear();
    if (!flay) {
      console.warn('FlayMarker: Flay data is required');
      return;
    }

    this.flay = flay;
    this.#options = { ...DEFAULT_OPTIONS, ...options };

    this.classList.toggle('shot', flay.video.likes?.length > 0);
    this.classList.toggle('archive', flay.archive);
    this.setShape(this.#options.shape);
    if (!this.#options.tooltip) {
      this.title = `${flay.studio}\n${flay.opus}\n${flay.title}\n${flay.actressList.join(', ')}\n${flay.release}\n${flay.video.rank}R (${flay.video.likes?.length || 0} likes)`;
    }
    if (this.#options.cover) {
      this.style.backgroundImage = `url(${ApiClient.buildUrl(`/static/cover/${flay.opus}`)})`;
      this.classList.add('cover');
    }
  }

  setShape(shape: ShapeType): void {
    if (!SHAPES.includes(shape)) {
      console.warn(`FlayMarker: Invalid shape type "${shape}"`);
      return;
    }
    requestAnimationFrame(() => {
      try {
        this.#options.shape = shape;
        this.classList.remove(...SHAPES);
        this.classList.add(shape);
        this.innerHTML = ''; // Clear content for other shapes
        switch (shape) {
          case 'heart':
            this.innerHTML = favorite;
            break;
          case 'star':
            if (this.flay?.video?.rank !== undefined) {
              const rankIndex = this.flay.video.rank + 1;
              if (rankIndex >= 0 && rankIndex < ranks.length) {
                this.innerHTML = String(ranks[rankIndex]);
              }
            }
            break;
          default:
            break; // For square, circle, rhombus, no additional content
        }
      } catch (error) {
        console.error('FlayMarker: Error updating shape:', error);
      }
    });
  }

  /**
   * 클릭 이벤트 핸들러
   * - Flay 팝업 표시
   */
  #popupFlayHandler(): void {
    popupFlay(this.flay.opus);
    this.classList.add('active');
  }

  /**
   * 툴팁을 표시합니다.
   * - 이미지와 주요 정보를 이 마커의 위치에 표시합니다.
   */
  #showTooltipHandler(): void {
    if (!this.#options.tooltip) return;

    const tooltipWidth = StyleUtils.remToPx(20);
    const { x, y, width, height } = this.getBoundingClientRect();
    const tooltipX = x + width / 2; // Center the tooltip horizontally
    const tooltipY = y + height / 2; // Center the tooltip vertically

    const tooltip = (document.querySelector('flay-tooltip') as FlayTooltip) || document.body.appendChild(new FlayTooltip(tooltipWidth));
    tooltip.show(this.flay, tooltipX, tooltipY);

    this.addEventListener('mouseleave', () => tooltip.hide(), { once: true });
  }
}

customElements.define('flay-marker', FlayMarker);
