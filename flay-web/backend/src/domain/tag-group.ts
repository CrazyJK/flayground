/** TagGroup 도메인 (Info<String> 대응) */
export interface TagGroup {
  id: string;
  name: string;
  desc: string;
  /** JSON 직렬화에서 제외 (@JsonIgnore 대응), 내부 용도 */
  lastModified: number;
}

/**
 * 새 TagGroup 생성
 * @param id TagGroup ID
 */
export function createTagGroup(id: string): TagGroup {
  return { id, name: '', desc: '', lastModified: -1 };
}
