/** Actress 도메인 (Info<String> 대응) */
export interface Actress {
  favorite: boolean;
  name: string;
  localName: string;
  otherNames: string[];
  birth: string;
  body: string;
  height: number;
  debut: number;
  comment: string;
  lastModified: number;
  /** 커버 이미지 파일 수 (getCoverSize() 대응) */
  coverSize: number;
}

/**
 * 새 Actress 생성
 * @param name 배우 이름 (key)
 */
export function createActress(name: string): Actress {
  return {
    favorite: false,
    name,
    localName: '',
    otherNames: [],
    birth: '',
    body: '',
    height: -1,
    debut: -1,
    comment: '',
    lastModified: -1,
    coverSize: 0,
  };
}
