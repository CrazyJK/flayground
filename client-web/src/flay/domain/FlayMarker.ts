import GroundFlay from '@base/GroundFlay';
import { FlayTooltip } from '@flay/domain/FlayTooltip';
import ApiClient from '@lib/ApiClient';
import { BlankFlay, Flay } from '@lib/FlayFetch';
import { popupFlay } from '@lib/FlaySearch';
import StyleUtils from '@lib/StyleUtils';
import favorite from '@svg/favorite';
import ranks from '@svg/ranks';
import './FlayMarker.scss';

export type ShapeType = (typeof FlayMarker.SHAPE)[keyof typeof FlayMarker.SHAPE];

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
export default class FlayMarker extends GroundFlay {
  static readonly SHAPE = {
    SQUARE: 'square',
    CIRCLE: 'circle',
    STAR: 'star',
    HEART: 'heart',
    RHOMBUS: 'rhombus',
  } as const;

  /** Flay 데이터 */
  flay: Flay = BlankFlay;
  #options: FlayMarkerOptions = { ...DEFAULT_OPTIONS };

  #boundClickHandler: EventListener;
  #boundMouseoverHandler: EventListener;

  /**
   * FlayMarker 생성자
   * @param flay Flay 데이터
   * @param options 마커 옵션
   */
  constructor(flay: Flay = BlankFlay, options: Partial<FlayMarkerOptions> = {}) {
    super();

    this.set(flay, options);
    this.#boundClickHandler = this.#popupFlayHandler.bind(this);
    this.#boundMouseoverHandler = this.#showTooltipHandler.bind(this);
  }

  connectedCallback(): void {
    this.addEventListener('click', this.#boundClickHandler);
    this.addEventListener('mouseover', this.#boundMouseoverHandler);
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.#boundClickHandler);
    this.removeEventListener('mouseover', this.#boundMouseoverHandler);
    this.clear();
  }

  /**
   * Clears the FlayMarker.
   */
  clear(): void {
    this.classList.remove(...Object.values(FlayMarker.SHAPE));
    this.classList.remove('active', 'shot', 'archive');
    this.title = '';
    document.querySelector('.flay-tooltip')?.remove(); // Remove existing tooltip
  }

  /**
   * Sets the FlayMarker.
   * @param flay The Flay data.
   * @param options The options for the FlayMarker.
   * @returns
   */
  set(flay: Flay, options: Partial<FlayMarkerOptions> = {}): void {
    this.clear();
    if (!flay.opus) {
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

  /**
   * Sets the shape of the FlayMarker.
   * @param shape The shape to set.
   * @returns
   */
  setShape(shape: ShapeType): void {
    requestAnimationFrame(() => {
      this.#options.shape = shape;
      this.classList.remove(...Object.values(FlayMarker.SHAPE));
      this.classList.add(shape);
      this.innerHTML = ''; // Clear content for other shapes
      switch (shape) {
        case FlayMarker.SHAPE.HEART:
          this.innerHTML = favorite;
          break;
        case FlayMarker.SHAPE.STAR:
          this.innerHTML = ranks[this.flay.video.rank + 1]!;
          break;
        default:
          break; // For square, circle, rhombus, no additional content
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
