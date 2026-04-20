/** Tag 도메인 (Info<Integer> 대응) */
export interface Tag {
  id: number;
  name: string;
  group: string;
  description: string;
  lastModified: number;
  /** 조회 시 집계된 사용 횟수 (선택적) */
  count?: number;
}

/**
 * 새 Tag 생성
 * @param id Tag ID
 */
export function createTag(id: number): Tag {
  return { id, name: '', group: '', description: '', lastModified: -1 };
}
