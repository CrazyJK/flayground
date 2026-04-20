/** Diary 메타 정보 */
export interface DiaryMeta {
  date: string;
  weather: string;
  title: string;
  created: string;
  lastModified: string | null;
  attachId: string;
}

/** Diary 도메인 */
export interface Diary {
  meta: DiaryMeta;
  content: string;
}
