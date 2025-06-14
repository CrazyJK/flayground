import FlayFetch, { type Actress, type Flay, type FullyFlay } from '@lib/FlayFetch';
import { OpusProvider, type OpusProviderOptions } from '@lib/OpusProvider';

// Type definitions
export interface FlayData {
  index: number;
  total: number;
  opus: string;
  flay: Flay;
  actress: Actress[];
}

/**
 * Flay 데이터를 제공하는 클래스
 * OpusProvider를 상속받아 opus 탐색 기능과 함께 완전한 flay 정보를 제공
 */
export class FlayProvider extends OpusProvider {
  private opus: string | null;

  constructor(opts?: OpusProviderOptions) {
    super(opts);
    this.opus = null;
  }
  /**
   * 현재 opus의 완전한 flay 데이터를 반환
   * FullyFlay 응답에서 flay와 actress를 추출하여 반환
   * @private
   */
  async #returnData(): Promise<FlayData> {
    if (this.opus === null) {
      throw new Error('No opus selected');
    }

    const fullyFlay: FullyFlay = await FlayFetch.getFullyFlay(this.opus);
    const { flay, actress } = fullyFlay;

    return {
      index: this.opusIndex,
      total: this.opusList?.length || 0,
      opus: this.opus,
      flay: flay,
      actress: actress,
    };
  }

  /**
   * 특정 opus의 완전한 flay 데이터 조회
   * @param opus - 조회할 opus
   * @returns 완전한 flay 데이터
   */
  async get(opus: string): Promise<FlayData> {
    const index = await this.getIndex(opus);
    this.opus = await this.getOpus(index);
    return await this.#returnData();
  }

  /**
   * 랜덤한 완전한 flay 데이터 조회
   * @returns 랜덤 flay 데이터
   */
  async random(): Promise<FlayData> {
    this.opus = await this.getRandomOpus();
    return await this.#returnData();
  }

  /**
   * 다음 완전한 flay 데이터 조회
   * @returns 다음 flay 데이터
   */
  async next(): Promise<FlayData> {
    this.opus = await this.getNextOpus();
    return await this.#returnData();
  }
  /**
   * 이전 완전한 flay 데이터 조회
   * @returns 이전 flay 데이터
   */
  async prev(): Promise<FlayData> {
    this.opus = await this.getPrevOpus();
    return await this.#returnData();
  }

  /**
   * 현재 선택된 opus 반환
   * @returns 현재 opus (없으면 null)
   */
  get currentOpus(): string | null {
    return this.opus;
  }

  /**
   * 현재 flay 데이터가 로드되어 있는지 확인
   * @returns 로드 여부
   */
  get isLoaded(): boolean {
    return this.opus !== null;
  }

  /**
   * 현재 선택된 flay의 완전한 데이터 다시 로드
   * @returns 현재 flay 데이터
   */
  async reload(): Promise<FlayData> {
    if (this.opus === null) {
      throw new Error('No opus selected');
    }
    return await this.#returnData();
  }
}
