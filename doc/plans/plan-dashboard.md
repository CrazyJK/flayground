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
- 하단 리스트는 Instance + History 두 데이터가 모두 준비된 후 렌더링

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

#### Release 월별 분포 (스파크라인)

instance + archive 합산 release를 **월별** 분포로 **인라인 바 차트** 표시.

```
계산: instance + archive 합산 → release.substring(0, 7)로 YYYY-MM 추출 → 월별 count 집계
시각화: CSS 바 차트 (height 비율), p95 percentile 클램프 적용
```

- p95 percentile 값으로 높이를 클램프하여 이상치 스케일 왜곡 방지
- p95 초과 바에는 `.bar.over` 클래스 부여 → `var(--color-red)` 배경으로 이상치 표시
- 시작/끝 연도 라벨 표시

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

## 4. 하단 리스트 섹션

카드 아래에 간결한 리스트를 배치한다.
Instance + History 데이터가 모두 준비된 후 렌더링.

### 4-1. 최근 플레이 목록 (최신 10건)

```
[opus] [title] [배우] [플레이 일시]
```

- `playHistory`에서 **중복 opus 제거** 후 최신 10건 추출
- **FlayMarker** 카버 표시 그리드 (cover: true, 200px 크기, tooltip 비활성화)

### 4-2. 최근 Like 목록 (최신 10건)

```
[opus] [title] [배우] [like 일시]
```

- 모든 instance의 `video.likes` 타임스탬프를 펼쳐서 최신 10건 정렬
- **FlayMarker** 카버 표시 그리드 (cover: true, 200px 크기, tooltip 비활성화)
- 데이터 구조: `{ opus, timestamp }` → timestamp 역순 정렬

### 4-3. 미평가 작품 (rank === 0, 최대 10건)

```
[opus] [title] [배우] [release]
```

- `instanceList.filter(f => f.video.rank === 0)` → release 최신순 최대 10건
- **FlayMarker** 카버 표시 그리드 (cover: true, 200px 크기, tooltip 비활성화)

---

## 5. UI 레이아웃

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
├─────────────────────────────────┤
│   최근 플레이 (FlayMarker 그리드)  │
├─────────────────────────────────┤
│   최근 Like (FlayMarker 그리드)    │
├─────────────────────────────────┤
│   미평가 작품 (FlayMarker 그리드)  │
└─────────────────────────────────┘
```

- Instance, Archive 카드: 전체 폭 1열 세로 배치 (`.card-row-layout`)
- Actress, History 카드: 2열 그리드 `grid-template-columns: repeat(2, 1fr)` (`.card-grid`)
- 분포 차트: 전체 폭 1열
- 하단 리스트: FlayMarker 사각형 그리드 (`flex-wrap`) × 3섹션 세로 배치
- 모바일/좁은 화면: 1열 스택

---

## 6. 컴포넌트 구조 (TypeScript)

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

  /** Instance + History 모두 준비됐을 때 하단 리스트 렌더링 */
  #tryRenderDependentSections(): void {
    if (this.#instanceList && this.#archiveList) {
      this.#renderReleaseDist();  // Release 분포
    }
    // 리스트 렌더링 조건 확인...
  }

  #renderReleaseDist(): void {
    // 월별 release 집계 + p95 클램프 바 차트 렌더링
  }

  #renderMarkerSection(container: HTMLElement, title: string, flays: Flay[]): void {
    // FlayMarker 카버 표시 그리드로 렌더링 (cover: true, 200px, tooltip: false)
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

## 7. 스타일 (SCSS)

모던하고 심플한 대시보드 스타일. 전용 폰트 사용.

```scss
// 대시보드 전용 폰트: Google Fonts 'Inter' (가독성 높은 UI 폰트)
// Page.ts에서 동적 로드하거나, FlayDashboard.ts 내에서 로드
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

flay-dashboard {
  display: block;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  max-width: 1080px;

  .dashboard-header {
    font-size: 1.5rem;
    font-weight: 700;
    padding: 1rem 0;
    border-bottom: 2px solid var(--color-border);
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
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    background: var(--color-bg);

    &.loading {
      opacity: 0.5;
      // 스켈레톤 또는 스피너
    }

    .card-title {
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      color: var(--color-text);
    }

    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 0.2rem 0;
      font-size: 0.85rem;

      .label {
        color: var(--color-text-secondary);
      }
      .value {
        font-weight: 600;
        font-variant-numeric: tabular-nums; // 숫자 정렬
      }
    }
  }

  // Release 분포 (전체 폭)
  .release-dist {
    padding: 0.75rem 0;
    border-top: 1px solid var(--color-border);

    .spark-row {
      display: flex;
      align-items: flex-end;
      gap: 1px;
      height: 3rem;

      .bar {
        flex: 1;
        background: var(--color-checked);
        border-radius: 2px 2px 0 0;
        min-width: 2px;
        transition: height 0.3s;

        &.over {
          background: var(--color-red); // p95 초과 이상치
        }
      }
    }

    .year-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: var(--color-text-secondary);
    }
  }

  // 하단 FlayMarker 그리드 섹션
  .marker-section {
    padding: 0.75rem 0;
    border-top: 1px solid var(--color-border);

    .section-title {
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
    }

    .marker-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;

      flay-marker {
        --marker-size: 200px;
      }
    }
  }

  // 카드 내 SVG 파이 차트
  .pie-chart {
    margin-top: 0.5rem;
    border-top: 1px dashed var(--color-border);

    .pie-title {
      font-weight: 600;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }
    .pie-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .pie-svg {
      flex-shrink: 0;
    }
    .pie-legend {
      font-size: 0.7rem;
    }
    .pie-legend-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .pie-legend-color {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 2px;
    }
    .pie-legend-label {
      color: var(--color-text-secondary);
    }
    .pie-legend-value {
      font-weight: 600;
    }
  }
}
```

**폰트 선택 근거:**

- `Inter`: 숫자 가독성 우수, tabular-nums 지원, 대시보드/통계 UI에 최적화된 오픈소스 폰트
- 폴백: `Segoe UI` (Windows) → `system-ui` → `sans-serif`
- Google Fonts CDN 로드 또는 로컬 설치

---

## 8. 페이지 통합

기존 페이지에 컴포넌트로 추가. (페이지 통합은 수동 작업)

```typescript
// 예시: index.ts 또는 원하는 page.xxx.ts
import { FlayDashboard } from '@flay/panel/FlayDashboard';
document.querySelector('article')!.appendChild(new FlayDashboard());
```

---

## 9. 구현 순서

1. `FlayDashboard.ts` 파일 생성 — 클래스, connectedCallback, 스켈레톤 HTML
2. 개별 비동기 API 호출 메서드 4개 구현 (`#loadInstanceCard` 등)
3. 각 카드별 통계 계산 + 렌더링 구현
4. Release 월별 분포 바 차트 구현 (p95 클램프)
5. 의존성 기반 렌더링 (Actress 카드 = Instance + Archive 대기, 리스트 = Instance + History 대기)
6. 하단 FlayMarker 그리드 3섹션 렌더링
7. `FlayDashboard.scss` 스타일 작성
8. 빌드 확인
