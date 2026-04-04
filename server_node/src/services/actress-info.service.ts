import { Actress } from '../domain/actress';
import { getInstanceFlayList } from '../sources/flay-source';
import { actressInfoSource } from '../sources/info-sources';
import { renameFlayActress } from './flay-file-handler';
import * as flayService from './flay.service';
import { sseSend } from './sse-emitters';

/**
 * Actress 정보 서비스.
 * Java ActressInfoService 대응
 */

/** name으로 Actress 조회 */
export function get(name: string): Actress {
  return actressInfoSource.get(name);
}

/** name으로 조회, 없으면 새로 생성 */
export function getOrNew(name: string): Actress {
  return actressInfoSource.getOrNew(name);
}

/** 전체 Actress 목록 */
export function list(): Actress[] {
  return actressInfoSource.getList();
}

/** query 문자열로 검색 */
export function find(query: string): Actress[] {
  return actressInfoSource.getList().filter((a) => JSON.stringify(a).includes(query));
}

/** localName으로 검색 */
export function findByLocalname(localname: string): Actress[] {
  return actressInfoSource.getList().filter((a) => a.localName === localname);
}

/** 새 Actress 생성 */
export function create(actress: Actress): Actress {
  const created = actressInfoSource.create(actress);
  sseSend(created);
  return created;
}

/** Actress 업데이트 */
export function update(actress: Actress): void {
  actressInfoSource.update(actress);
  sseSend(actress);
}

/** Actress 삭제 */
export function deleteActress(actress: Actress): void {
  actressInfoSource.delete(actress.name);
  sseSend(actress);
}

/**
 * 이름을 변경한다.
 * Java ActressInfoService.rename() 대응
 *
 * @param actress 새 이름이 담긴 Actress 객체
 * @param oldName 변경 전 이름
 */
export function rename(actress: Actress, oldName: string): void {
  if (actress.name === oldName) {
    // 이름이 같으면 정보만 수정
    actressInfoSource.update(actress);
  } else {
    console.log(`[ActressService] 이름 변경: ${oldName} -> ${actress.name}`);

    // 새 이름이 이미 존재하면 업데이트, 아니면 생성
    if (actressInfoSource.contains(actress.name)) {
      actressInfoSource.update(actress);
    } else {
      actressInfoSource.create(actress);
    }

    // 파일에서 이름 변경
    const flayListByActress = flayService.findByField('actress', oldName);
    console.log(`[ActressService] ${oldName} -> ${actress.name}: ${flayListByActress.length}건 발견`);

    for (const flay of flayListByActress) {
      const newActressList = flay.actressList.filter((a) => a !== oldName);
      newActressList.push(actress.name);
      renameFlayActress(flay, newActressList);
    }

    sseSend(actress);
  }
}

/**
 * 있으면 수정, 없으면 생성.
 * Java ActressInfoService.persist() 대응
 */
export function persist(actress: Actress): void {
  if (actressInfoSource.contains(actress.name)) {
    actressInfoSource.update(actress);
  } else {
    actressInfoSource.create(actress);
  }
  sseSend(actress);
}

/**
 * favorite 상태를 설정한다.
 */
export function setFavorite(name: string, checked: boolean): void {
  const actress = actressInfoSource.get(name);
  actress.favorite = checked;
  actressInfoSource.update(actress);
  sseSend(actress);
}

/**
 * 이름 유사도 체크.
 * Java ActressInfoService.funcNameCheck() 대응
 */
export function funcNameCheck(limit: number): NameCheckResult[] {
  // flay에서 사용 중인 배우 목록만 추출
  const actressNames = new Set<string>();
  for (const flay of getInstanceFlayList()) {
    flay.actressList.forEach((a) => actressNames.add(a));
  }
  const distinctActressList = [...actressNames].map((name) => actressInfoSource.get(name));

  return checkNameDistance(distinctActressList, limit);
}

/** 이름 유사도 체크 결과 */
export interface NameCheckResult {
  name1: string;
  name2: string;
  distance: number;
}

/**
 * Levenshtein 거리를 이용한 이름 유사도 체크.
 * Java NameDistanceChecker 대응
 */
function checkNameDistance(actressList: Actress[], limit: number): NameCheckResult[] {
  const results: NameCheckResult[] = [];

  for (let i = 0; i < actressList.length; i++) {
    for (let j = i + 1; j < actressList.length; j++) {
      const a1 = actressList[i];
      const a2 = actressList[j];
      const distance = levenshteinDistance(a1.name, a2.name);
      const maxLen = Math.max(a1.name.length, a2.name.length);
      const similarity = maxLen > 0 ? 1 - distance / maxLen : 1;

      if (similarity >= limit) {
        results.push({
          name1: a1.name,
          name2: a2.name,
          distance: similarity,
        });
      }
    }
  }

  return results.sort((a, b) => b.distance - a.distance);
}

/**
 * Levenshtein 편집 거리
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }

  return d[m][n];
}
