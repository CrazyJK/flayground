# Flay 대시보드 상세 구현 계획

## 개요

Flay 데이터를 한 눈에 파악할 수 있는 대시보드 커스텀 엘리먼트.
Instance, Archive, 배우, 히스토리 4개 섹션의 핵심 수치를 카드 형태로 요약하고,
주요 리스트를 간결하게 보여준다.

---

## 1. 파일 구조

```
client-web/src/flay/panel/
├── FlayDashboard.ts       # 커스텀 엘리먼트 (메인)
├── FlayDashboard.scss     # 대시보드 전용 스타일
```

- `FlayDashboard`는 `GroundFlay` (HTMLElement 확장) 상속
- 커스텀 엘리먼트 태그: `<flay-dashboard>`

---

## 2. 데이터 소스 및 API 호출

API별 응답 시간 차이가 크므로 `Promise.all`이 아닌 **개별 비동기 호출**로 처리.
각 API 응답이 도착하는 즉시 해당 섹션을 렌더링한다.

```typescript
// 각 API를 개별 호출 → 도착 즉시 해당 카드 렌더링
this.#loadInstanceCard(); // FlayFetch.getFlayAll()
this.#loadArchiveCard(); // FlayFetch.getArchiveAll()
this.#loadActressCard(); // FlayFetch.getActressAll()
this.#loadHistoryCard(); // FlayFetch.getHistoryListByAction('PLAY', 0)
```

**각 메서드는 독립적으로 실행:**

- 호출 → 로딩 스피너 표시 → 데이터 도착 → 통계 계산 → 카드 렌더링
- 한 섹션이 느려도 다른 섹션은 먼저 표시됨

### 사용 타입

| 타입          | 주요 필드                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `Flay`        | opus, studio, actressList, release, score, video.rank, video.likes[], video.play, video.lastPlay, files, length |
| `Archive`     | Flay와 동일 구조 (archive: true)                                                                                |
| `Actress`     | name, favorite, birth, debut, lastModified, coverSize                                                           |
| `FlayHistory` | date, opus, action('PLAY'), desc                                                                                |

---

## 3. 대시보드 섹션 구성

### 3-1. Instance 카드

현재 보유 중인 Flay 요약.

| 항목       | 계산                                                            |
| ---------- | --------------------------------------------------------------- |
| Total      | `instanceList.length`                                           |
| Liked      | `instanceList.filter(f => f.video.likes.length > 0).length`     |
| 평균 Score | `Σ flay.score / count`                                          |
| 평균 Rank  | `Σ flay.video.rank / count` (rank > 0인 것만)                   |
| 총 용량    | `Σ flay.length` → **TB** 단위 표시                              |
| 자막 보유  | `instanceList.filter(f => f.files.subtitles.length > 0).length` |

**Rank 분포** — SVG 파이 차트로 표시 (0~5 각 랭크별 건수)
**상위 스튜디오** — studio별 count 상위 10개 + 그외, SVG 파이 차트
**상위 배우** — flay 수 기준 상위 10명 + 그외 (이름 없거나 'Amateur' 제외), SVG 파이 차트

→ 3개 파이 차트는 `.pie-charts-row` 3열 그리드로 가로 배치 (title → SVG → legend 세로 구조)
→ 범례에는 건수만 표시 (퍼센트는 SVG 툴팁으로 확인 가능)

### 3-2. Archive 카드

삭제/이관된 과거 Flay 요약.

| 항목         | 계산                                                     |
| ------------ | -------------------------------------------------------- |
| Total        | `archiveList.length`                                     |
| Release 범위 | release 연도 최소 ~ 최대                                 |
| 평균 재생    | `Σ flay.video.play / count` (아카이브 전 평균 재생 횟수) |

**Rank 분포** — SVG 파이 차트로 표시 (0~5 각 랭크별 건수)
**상위 스튜디오** — studio별 count 상위 10개 + 그외, SVG 파이 차트
**상위 배우** — flay 수 기준 상위 10명 + 그외 (이름 없거나 'Amateur' 제외), SVG 파이 차트

→ 3개 파이 차트는 `.pie-charts-row` 3열 그리드로 가로 배치

#### Release 월별 분포 (스파크라인)

instance + archive 합산 release를 **월별** 분포로 **인라인 바 차트** 표시.

```
계산: instance + archive 합산 → release.substring(0, 7)로 YYYY.MM 추출 → 월별 count 집계
시각화: CSS 바 차트 (height 비율), 고정 최대값 100건 기준
```

- 고정 최대값 100건 기준으로 높이 계산, 100건 초과 시 클램프 + `.bar.over` 클래스로 이상치 표시
- 연도 라벨: 매 1월(`.01`)에 연도 표시
- 바 차트 높이 **5rem**으로 월별 분포 시각적 강조
- 제목 옥에 총 건수 표시 (`.dist-total`)
- release 형식: `YYYY.MM.DD` (닷 구분자)

### 3-3. Actress 카드

배우 통계. 전체 배우 대상 (출현 횟수 조건 없음).

| 항목         | 계산                                         |
| ------------ | -------------------------------------------- |
| 전체 배우 수 | `actressList.length`                         |
| 선호 배우    | `actressList.filter(a => a.favorite).length` |
| 보유 중      | instance에 등장하는 배우                     |
| 아카이브     | archive에만 등장하고 instance에 없는 배우    |

**계산 방법:**

```typescript
const instanceActressSet = new Set(instanceList.flatMap((f) => f.actressList));
const archiveActressSet = new Set(archiveList.flatMap((f) => f.actressList));

const activeCount = actressList.filter((a) => instanceActressSet.has(a.name)).length;
const archivedCount = actressList.filter((a) => !instanceActressSet.has(a.name) && archiveActressSet.has(a.name)).length;
```

> Actress 카드는 Instance + Archive 양쪽 데이터가 필요하므로,
> 두 API 응답이 모두 도착한 후 렌더링한다.

### 3-4. History 카드

재생 이력 요약. 날짜는 since 형식으로 표시.

| 항목          | 계산                                  |
| ------------- | ------------------------------------- |
| 마지막 플레이 | `playHistory[0].date` (최신순 정렬됨) |
| 히스토리 시작 | `playHistory[마지막].date` since 형식 |

---

## 4. UI 레이아웃

세로 모니터(1080 × 1846) 기준으로 설계. 1080px 폭에 최적화.

```
┌─────────────────────────────────┐  1080px
│          Flay Dashboard         │
├─────────────────────────────────┤
│   Instance (카드, 전체 폭)        │
├─────────────────────────────────┤
│   Archive  (카드, 전체 폭)        │
├────────────────┬────────────────┤
│   Actress      │    History     │
│   (카드)        │    (카드)       │
├─────────────────────────────────┤
│   Release 월별 분포 (바 차트)       │
└─────────────────────────────────┘
```

- Instance, Archive 카드: 전체 폭 1열 세로 배치 (`.card-row-layout`)
- Actress, History 카드: 2열 그리드 `grid-template-columns: repeat(2, 1fr)` (`.card-grid`)
- 분포 차트: 전체 폭 1열

- 모바일/좁은 화면: 1열 스택

---

## 5. 컴포넌트 구조 (TypeScript)

```typescript
export class FlayDashboard extends GroundFlay {
  // 섹션 간 데이터 공유용
  #instanceList: Flay[] | null = null;
  #archiveList: Archive[] | null = null;

  connectedCallback(): void {
    this.innerHTML = /* 4개 카드 + 리스트 영역 스켈레톤 */;
    // 개별 비동기 호출 (도착 즉시 렌더링)
    void this.#loadInstanceCard();
    void this.#loadArchiveCard();
    void this.#loadActressCard();
    void this.#loadHistoryCard();
  }

  async #loadInstanceCard(): Promise<void> {
    // 1. FlayFetch.getFlayAll()
    // 2. this.#instanceList에 저장
    // 3. Instance 카드 렌더링
    // 4. this.#tryRenderDependentSections() — Actress, 리스트 의존성 확인
  }

  async #loadArchiveCard(): Promise<void> {
    // 1. FlayFetch.getArchiveAll()
    // 2. this.#archiveList에 저장
    // 3. Archive 카드 렌더링 + Release 분포
    // 4. this.#tryRenderDependentSections()
  }

  async #loadActressCard(): Promise<void> {
    // 1. FlayFetch.getActressAll()
    // 2. Instance + Archive 도착 대기 확인
    // 3. 전체 배우 대상 Actress 카드 렌더링
  }

  async #loadHistoryCard(): Promise<void> {
    // 1. FlayFetch.getHistoryListByAction('PLAY', 0)
    // 2. History 카드 렌더링
    // 3. this.#tryRenderDependentSections()
  }

  /** Instance + Archive 모두 준비됐을 때 Release 분포 렌더링 */
  #tryRenderDependentSections(): void {
    if (this.#instanceList && this.#archiveList) {
      this.#renderReleaseDist();  // Release 분포
    }
  }

  #renderReleaseDist(): void {
    // 월별 release 집계 + 고정 100건 기준 바 차트 렌더링
  }

  #renderPieChart(container: Element, title: string, data: [string, number][]): void {
    // SVG 파이 차트 렌더링 (title + pie svg + legend)
  }

  #buildPieData(map: Map<string, number>, topN: number): [string, number][] {
    // 상위 topN + '그외' 합산 데이터 생성
  }

  static #PIE_COLORS: string[] = [/* 11색 팔레트 */];

  #formatSince(epochMs: number): string {
    // epoch ms를 "N년 M개월 전" 형식으로 변환
  }
}

customElements.define('flay-dashboard', FlayDashboard);
```

### 내부 타입

```typescript
interface DashboardStats {
  instance: {
    total: number;
    liked: number;
    avgScore: number;
    avgRank: number;
    totalSize: number; // bytes
    withSubtitles: number;
  };
  archive: {
    total: number;
    yearRange: string; // '2008 ~ 2026'
    avgPlay: number;
    rankCounts: Map<number, number>; // 파이 차트용 (0~5)
    studioPie: [string, number][]; // 파이 차트용, 상위 10 + 그외
    actressPie: [string, number][]; // 파이 차트용, 상위 10 + 그외
  };
  actress: {
    total: number;
    favorite: number;
    active: number;
    archived: number;
  };
  history: {
    lastPlayDate: string;
    since: string; // "N년 M개월 전" 형식
  };
}
```

---

## 6. 스타일 (SCSS)

모던하고 심플한 대시보드 스타일. 전용 폰트 사용.

```scss
// 대시보드 전용 폰트: Google Fonts 'Inter' (가독성 높은 UI 폰트)
// Page.ts에서 동적 로드하거나, FlayDashboard.ts 내에서 로드
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

flay-dashboard {
  display: block;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  max-width: 1080px;
  padding: 0 0.75rem;

  .dashboard-header {
    font-size: 1.25rem;
    font-weight: 700;
    padding: 1rem 0 0.75rem;
    letter-spacing: -0.02em;
    border-bottom: 1px solid var(--color-border);
  }

  // Instance + Archive: 전체 폭 1열 세로 배치
  .card-row-layout {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 0;
  }

  // Actress + History: 2열 그리드
  .card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0 0 0.75rem;
  }

  .card {
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-hugest);
    padding: 1.25rem 1.5rem;
    background: var(--color-bg);
    box-shadow: var(--box-shadow-smallest);

    &.loading {
      opacity: 0.5;
      // 스켈레톤 또는 스피너
    }

    .card-title {
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 0.5rem;
      color: var(--color-text);
      letter-spacing: -0.01em;
    }

    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 0.15rem 0;
      font-size: 0.85rem;

      .label {
        color: var(--color-text-secondary);
      }
      .value {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
    }
  }

  // 파이 차트 3열 그리드 (카드 내부)
  .pie-charts-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--color-border);
  }

  // Release 분포 (전체 폭)
  .release-dist {
    padding: 1rem 0;
    border-top: 1px solid var(--color-border);

    .dist-title {
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 0.5rem;

      .dist-total {
        font-weight: 400;
        font-size: 0.8rem;
        color: var(--color-text-secondary);
      }
    }

    .spark-row {
      display: flex;
      align-items: flex-end;
      gap: 1px;
      height: 5rem;

      .bar {
        flex: 1;
        background: var(--color-checked);
        border-radius: 1px 1px 0 0;
        min-width: 2px;
        transition: height 0.3s;

        &.over {
          background: var(--color-red);
        }
      }
    }

    .year-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: var(--color-text-secondary);
      margin-top: 0.25rem;
    }
  }

  // 카드 내 SVG 파이 차트 (세로 배치: title → SVG → legend)
  .pie-chart {
    display: flex;
    flex-direction: column;
    align-items: center;

    .pie-title {
      font-weight: 600;
      font-size: 0.75rem;
      text-align: center;
    }
    .pie-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .pie-svg {
      width: 80px;
      height: 80px;
    }
    .pie-legend {
      font-size: 0.7rem;
    }
    .pie-legend-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .pie-legend-color {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 1px;
    }
    .pie-legend-label {
      color: var(--color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pie-legend-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }
}
```

**폰트 선택 근거:**

- `Inter`: 숫자 가독성 우수, tabular-nums 지원, 대시보드/통계 UI에 최적화된 오픈소스 폰트
- 폴백: `Segoe UI` (Windows) → `system-ui` → `sans-serif`
- Google Fonts CDN 로드 또는 로컬 설치

---

## 7. 페이지 통합

기존 페이지에 컴포넌트로 추가. (페이지 통합은 수동 작업)

```typescript
// 예시: index.ts 또는 원하는 page.xxx.ts
import { FlayDashboard } from '@flay/panel/FlayDashboard';
document.querySelector('article')!.appendChild(new FlayDashboard());
```

---

## 8. 구현 순서

1. `FlayDashboard.ts` 파일 생성 — 클래스, connectedCallback, 스켈레톤 HTML
2. 개별 비동기 API 호출 메서드 4개 구현 (`#loadInstanceCard` 등)
3. 각 카드별 통계 계산 + 렌더링 구현
4. Release 월별 분포 바 차트 구현 (고정 100건 기준)
5. 의존성 기반 렌더링 (Actress 카드 = Instance + Archive 대기)
6. `FlayDashboard.scss` 스타일 작성
7. 빌드 확인
