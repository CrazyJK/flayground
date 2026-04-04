/** Studio 도메인 (Info<String> 대응) */
export interface Studio {
  name: string;
  company: string;
  /** 홈페이지 URL 문자열 (Java URL -> string) */
  homepage: string;
  lastModified: number;
}

/**
 * 새 Studio 생성
 * @param name 스튜디오 이름 (key)
 */
export function createStudio(name: string): Studio {
  return { name, company: '', homepage: '', lastModified: -1 };
}
