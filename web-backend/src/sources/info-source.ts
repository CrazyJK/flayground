import fs from 'fs';
import path from 'path';

/**
 * 제네릭 JSON 파일 기반 데이터 소스.
 * Java InfoSourceJsonAdapter 대응 - JSON 파일을 메모리에 로드하고 CRUD 시 전체 파일을 다시 쓴다.
 * @template T 도메인 타입
 * @template K 키 타입
 */
export class InfoSource<T, K> {
  private list: T[] = [];
  private readonly filePath: string;
  private readonly getKey: (item: T) => K;
  private readonly newInstance: (key: K) => T;
  private readonly touch: (item: T) => void;

  /**
   * @param filePath JSON 파일 경로
   * @param getKey 아이템에서 키를 추출하는 함수
   * @param newInstance 새 아이템을 생성하는 함수
   * @param touch lastModified를 갱신하는 함수
   */
  constructor(filePath: string, getKey: (item: T) => K, newInstance: (key: K) => T, touch: (item: T) => void) {
    this.filePath = filePath;
    this.getKey = getKey;
    this.newInstance = newInstance;
    this.touch = touch;
  }

  /**
   * JSON 파일을 읽어 메모리에 로드한다.
   * @param onLoaded 로드 후 추가 처리 콜백
   */
  load(onLoaded?: (list: T[]) => void): void {
    if (!fs.existsSync(this.filePath)) {
      console.warn(`[InfoSource] 파일 없음, 빈 목록으로 시작: ${this.filePath}`);
      this.list = [];
      return;
    }
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    this.list = JSON.parse(raw) as T[];
    console.log(`[InfoSource] ${String(this.list.length).padStart(5)} 건 로드 - ${path.basename(this.filePath)}`);
    if (onLoaded) {
      onLoaded(this.list);
    }
  }

  /** 전체 목록 반환 */
  getList(): T[] {
    return this.list;
  }

  /** 키로 아이템 조회. 없으면 null */
  find(key: K): T | null {
    return this.list.find((item) => this.getKey(item) === key) ?? null;
  }

  /** 키로 아이템 조회. 없으면 에러 */
  get(key: K): T {
    const item = this.find(key);
    if (!item) {
      throw new Error(`Not found: ${String(key)}`);
    }
    return item;
  }

  /** 키로 조회하되, 없으면 새로 생성하여 추가 후 반환 */
  getOrNew(key: K): T {
    const existing = this.find(key);
    if (existing) return existing;

    const newItem = this.newInstance(key);
    this.list.push(newItem);
    this.save();
    return newItem;
  }

  /** 새 아이템 추가. 키 중복 시 에러 */
  create(item: T): T {
    const key = this.getKey(item);
    if (this.find(key)) {
      throw new Error(`Duplicated key: ${String(key)}`);
    }
    this.touch(item);
    this.list.push(item);
    this.save();
    return item;
  }

  /** 기존 아이템 업데이트. 없으면 에러 */
  update(item: T): void {
    const key = this.getKey(item);
    const idx = this.list.findIndex((i) => this.getKey(i) === key);
    if (idx === -1) {
      throw new Error(`Not found for update: ${String(key)}`);
    }
    this.touch(item);
    this.list[idx] = item;
    this.save();
  }

  /** 키에 해당하는 아이템 삭제. 없으면 에러 */
  delete(key: K): void {
    const idx = this.list.findIndex((i) => this.getKey(i) === key);
    if (idx === -1) {
      throw new Error(`Not found for delete: ${String(key)}`);
    }
    this.list.splice(idx, 1);
    this.save();
  }

  /** 키 존재 여부 확인 */
  contains(key: K): boolean {
    return this.find(key) !== null;
  }

  /** 현재 메모리 목록을 JSON 파일에 쓴다 */
  save(): void {
    const json = JSON.stringify(this.list, null, 2);
    fs.writeFileSync(this.filePath, json, 'utf-8');
  }
}
