import { FlayTooltip } from '@flay/domain/FlayTooltip';
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
}

/** 기본 옵션 */
const DEFAULT_OPTIONS: FlayMarkerOptions = {
  tooltip: false,
  shape: 'square',
};

/**
 * Flay 정보를 표시하는 마커 컴포넌트
 * - 다양한 모양 지원 (square, circle, star, heart, rhombus)
 * - 클릭 시 Flay 팝업 표시
 * - 호버 시 툴팁 표시 옵션
 */
export default class FlayMarker extends HTMLLabelElement {
  /** Flay 데이터 */
  flay: Flay;
  #options: FlayMarkerOptions;

  /**
   * FlayMarker 생성자
   * @param flay Flay 데이터
   * @param options 마커 옵션
   */
  constructor(flay: Flay, options: Partial<FlayMarkerOptions> = {}) {
    super();

    this.classList.add('flay-marker');
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
    this.flay = null;
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
                this.innerHTML = ranks[rankIndex];
              }
            }
            break;
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
  #showTooltipHandler(): Promise<void> {
    if (!this.#options.tooltip) return;

    const tooltipWidth = StyleUtils.remToPx(20);
    const { x, y, width, height } = this.getBoundingClientRect();
    const tooltipX = x + width / 2; // Center the tooltip horizontally
    const tooltipY = y + height / 2; // Center the tooltip vertically

    const tooltip = (document.querySelector('.flay-tooltip') || document.body.appendChild(new FlayTooltip(tooltipWidth))) as FlayTooltip;
    tooltip.show(this.flay, tooltipX, tooltipY);

    this.addEventListener('mouseleave', () => tooltip.hide(), { once: true });
  }
}

customElements.define('flay-marker', FlayMarker, { extends: 'label' });
