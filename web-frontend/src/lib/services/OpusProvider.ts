import FlayFetch, { type SearchCondition } from '@lib/FlayFetch';
import RandomUtils from '@lib/RandomUtils';

// Type definitions
export interface OpusProviderOptions extends Partial<SearchCondition> {}

const DEFAULT_CONDITION: SearchCondition = {
  search: '',
  withSubtitles: false,
  withFavorite: false,
  withNoFavorite: false,
  rank: [],
  sort: 'RELEASE',
  reverse: false,
  studio: '',
  opus: '',
  title: '',
  actress: '',
  release: '',
};

/**
 * Opus 목록을 관리하고 순차/랜덤 접근을 제공하는 클래스
 * 검색 조건을 통해 필터링된 opus 목록을 캐싱하고 효율적인 탐색을 지원
 */
export class OpusProvider {
  protected opusList: string[] | null = null;
  protected opusIndex: number = -1;
  private opusIndexes: number[] = [];
  private condition: SearchCondition = DEFAULT_CONDITION;

  /**
   * OpusProvider 생성자
   * @param opts - 검색 조건 옵션
   */
  constructor(opts?: OpusProviderOptions) {
    this.setCondition(opts ?? {});
  }

  /**
   * 검색 조건 설정
   * @param condition - 새로운 검색 조건
   */
  setCondition(condition: OpusProviderOptions): void {
    this.condition = Object.assign({}, DEFAULT_CONDITION, condition);
    this.setOpusList(null);
  }

  /**
   * opus 목록 설정
   * @param list - opus 목록 배열 또는 null
   */
  setOpusList(list: string[] | null): void {
    this.opusList = list;
    this.opusIndex = -1;
    this.opusIndexes = [];
  }

  /**
   * 서버에서 opus 목록을 가져와 캐싱
   * @private
   */
  private async fetchOpusList(): Promise<void> {
    if (this.opusList === null) {
      this.opusList = await FlayFetch.getOpusList(this.condition);
    }
  }

  /**
   * 랜덤한 opus 반환
   * 중복 방지를 위해 사용된 인덱스를 추적
   * @returns 랜덤 opus
   */
  async getRandomOpus(): Promise<string> {
    await this.fetchOpusList();
    if (!this.opusList || this.opusList.length === 0) {
      throw new Error('Opus list is empty');
    }

    if (this.opusIndexes.length === 0) {
      this.opusIndexes.push(...Array.from({ length: this.opusList.length }, (_, i) => i));
    }

    const randomIndexIndex = RandomUtils.getRandomInt(0, this.opusIndexes.length);
    const removedIndex = this.opusIndexes.splice(randomIndexIndex, 1)[0];

    if (removedIndex === undefined) {
      throw new Error('Failed to get random index');
    }

    this.opusIndex = removedIndex;
    return this.opusList[this.opusIndex]!;
  }

  /**
   * 다음 opus 반환 (순환)
   * @returns 다음 opus
   */
  async getNextOpus(): Promise<string> {
    await this.fetchOpusList();
    if (!this.opusList || this.opusList.length === 0) {
      throw new Error('Opus list is empty');
    }

    ++this.opusIndex;
    if (this.opusIndex === this.opusList.length) {
      this.opusIndex = 0;
    }
    if (this.opusIndexes.includes(this.opusIndex)) {
      this.opusIndexes.splice(this.opusIndexes.indexOf(this.opusIndex), 1);
    }
    return this.opusList[this.opusIndex]!;
  }

  /**
   * 이전 opus 반환 (순환)
   * @returns 이전 opus
   */
  async getPrevOpus(): Promise<string> {
    await this.fetchOpusList();
    if (!this.opusList || this.opusList.length === 0) {
      throw new Error('Opus list is empty');
    }

    --this.opusIndex;
    if (this.opusIndex === -1) {
      this.opusIndex = this.opusList.length - 1;
    }
    if (this.opusIndexes.includes(this.opusIndex)) {
      this.opusIndexes.splice(this.opusIndexes.indexOf(this.opusIndex), 1);
    }
    return this.opusList[this.opusIndex]!;
  }

  /**
   * 현재 선택된 opus 반환
   * @returns 현재 opus
   */
  async getCurrentOpus(): Promise<string> {
    await this.fetchOpusList();
    if (!this.opusList || this.opusList.length === 0) {
      throw new Error('Opus list is empty');
    }
    if (this.opusIndex === -1) {
      throw new Error('No opus selected');
    }
    return this.opusList[this.opusIndex]!;
  }

  /**
   * 특정 인덱스의 opus 반환
   * @param index - 가져올 opus의 인덱스
   * @returns 해당 인덱스의 opus
   */
  async getOpus(index: number): Promise<string> {
    await this.fetchOpusList();
    if (!this.opusList || this.opusList.length === 0) {
      throw new Error('Opus list is empty');
    }

    this.opusIndex = Math.max(index, 0);
    this.opusIndex = Math.min(this.opusIndex, this.opusList.length - 1);
    return this.opusList[this.opusIndex]!;
  }

  /**
   * 특정 opus의 인덱스 반환
   * @param opus - 찾을 opus
   * @returns opus의 인덱스 (없으면 -1)
   */
  async getIndex(opus: string): Promise<number> {
    await this.fetchOpusList();
    if (!this.opusList) {
      return -1;
    }

    if (this.opusList.includes(opus)) {
      this.opusIndex = this.opusList.indexOf(opus);
      return this.opusIndex;
    } else {
      return -1;
    }
  }

  /**
   * opus 목록의 크기 반환
   * @returns 목록 크기
   */
  get size(): number {
    return this.opusList?.length ?? 0;
  }
}
