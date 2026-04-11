# Flay 대시보드 상세 구현 계획

## 개요

Flay 데이터를 한 눈에 파악할 수 있는 대시보드 커스텀 엘리먼트.
Instance, Archive, 배우, 히스토리 4개 섹션의 핵심 수치를 카드 형태로 요약하고,
ECharts 라이브러리를 활용한 파이/트리맵/바 차트로 분포 데이터를 시각화한다.

### 사용 라이브러리

- **ECharts 6.0.0** + zrender 6.0.0
- Tree-shaking 모듈러 임포트: `PieChart`, `BarChart`, `TreemapChart` / `TitleComponent`, `TooltipComponent`, `LegendComponent`, `GridComponent` / `CanvasRenderer`
- DataZoom 미사용 (Release 차트에서 줌 제거)

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

| 타입      | 주요 필드                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `Flay`    | opus, studio, actressList, release, score, video.rank, video.likes[], video.play, video.lastPlay, files, length |
| `Archive` | Flay와 동일 구조 (archive: true)                                                                                |
| `Actress` | name, favorite, birth, debut, lastModified, coverSize                                                           |

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

**Rank 분포** — ECharts 파이 차트 (0~5 각 랭크별 건수, 슬라이스 내부에 `랭크\n건수` 라벨, 툴팁 지원)
**상위 스튜디오** — ECharts 트리맵 (studio별 count 전체 대비 2% 이상, 최대 20개, 그외 제외)
**상위 배우** — ECharts 트리맵 (flay 수 기준 전체 대비 2% 이상, 최대 20명, 그외 제외, 이름 없거나 'Amateur' 제외)

→ 3개 차트는 `.charts-row` 3열 그리드로 가로 배치 (`.echart-cell` > `.echart-title` + `.echart-container`)
→ Rank 분포: 파이 차트, 슬라이스 내부 라벨 (value=0인 항목은 라벨 숨김)
→ 스튜디오/배우: 트리맵으로 영역 비율 시각화, 라벨에 이름+건수 표시, 툴팁으로 상세 확인
→ 트리맵 위치: `left/top/right/bottom: 0`으로 컨테이너 완전 채움 (width/height: 100% 대신)

### 3-2. Archive 카드

삭제/이관된 과거 Flay 요약.

| 항목         | 계산                                                     |
| ------------ | -------------------------------------------------------- |
| Total        | `archiveList.length`                                     |
| Release 범위 | release 연도 최소 ~ 최대                                 |
| 평균 재생    | `Σ flay.video.play / count` (아카이브 전 평균 재생 횟수) |

**Rank 분포** — ECharts 파이 차트 (0~5 각 랭크별 건수, 슬라이스 내부 라벨, 툴팁 지원)
**상위 스튜디오** — ECharts 트리맵 (studio별 count 전체 대비 2% 이상, 최대 20개, 그외 제외)
**상위 배우** — ECharts 트리맵 (flay 수 기준 전체 대비 2% 이상, 최대 20명, 그외 제외, 이름 없거나 'Amateur' 제외)

→ 3개 차트는 `.charts-row` 3열 그리드로 가로 배치

### 3-5. Release 카드

instance + archive 합산 release를 **월별** 분포로 **ECharts 바 차트** 표시.
다른 섹션과 동일한 **카드 형태** (`<div class="card" id="card-release">`)로 표시.
Instance + Archive 양쪽 데이터가 필요하므로 두 API 응답이 모두 도착한 후 렌더링.

```
계산: instance + archive 합산 → release.substring(0, 7)로 YYYY.MM 추출 → 연속 월 범위 생성 → 월별 count 집계
시각화: ECharts BarChart, yAxis max 100, 100건 초과 시 빨간색 표시
```

- yAxis 최대값 100건 기준, 100 초과 시 `#e15759` 빨간색으로 이상치 표시
- xAxis 라벨: 매 1월(`.01`)에만 연도 표시
- 차트 높이 **200px** (`.echart-bar`), barMaxWidth 4
- grid: `{ left: 5, right: 5, top: 10, bottom: 10 }` — 여백 최소화
- DataZoom 미사용 (줌 제거)
- 카드 제목 옆에 총 건수 표시 (`.release-total`)
- 툴팁: axis 트리거, `YYYY.MM: N건` 형식
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
┌─────────────────────────────────┐  1080px (min-width)
│          Flay Dashboard         │
├─────────────────────────────────┤
│   Instance (카드, 전체 폭)        │
├─────────────────────────────────┤
│   Archive  (카드, 전체 폭)        │
├────────────────┬────────────────┤
│   Actress      │    History     │
│   (카드)        │    (카드)       │
├─────────────────────────────────┤
│   Release (카드, 전체 폭)         │
└─────────────────────────────────┘
```

- Instance, Archive 카드: 전체 폭 1열 세로 배치 (`.card-row-layout`)
- Actress, History 카드: 2열 그리드 `grid-template-columns: repeat(2, 1fr)` (`.card-grid`)
- Release 카드: 전체 폭 1열, 다른 카드와 동일한 `.card` 스타일 적용

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

  /** ECharts 인스턴스 관리 (리사이즈 대응용) */
  #charts: echarts.ECharts[] = [];

  /** ECharts 인스턴스 등록 + 다음 프레임에 리사이즈 예약 */
  #registerChart(chart: echarts.ECharts): void {
    this.#charts.push(chart);
    requestAnimationFrame(() => chart.resize());
  }

  #renderPieChart(container: Element, title: string, data: { name: string; value: number }[]): void {
    // ECharts 파이 차트 렌더링 (Rank 분포용)
    // radius ['15%', '80%'], label position: 'inside', value=0인 항목은 라벨 숨김
  }

  #renderTreemap(container: Element, title: string, data: { name: string; value: number }[]): void {
    // ECharts 트리맵 렌더링 (스튜디오/배우용)
    // roam: false, nodeClick: false, breadcrumb 숨김, 라벨에 이름+건수 표시
  }

  #buildPieData(map: Map<string, number>, minRatio = 0.02, maxItems = 20, includeRest = true): { name: string; value: number }[] {
    // 전체 대비 비율 >= minRatio인 항목만 개별 표시, 최대 maxItems개
    // includeRest=true시 나머지 '그외'로 합산, false시 그외 제외
    // 비율 필터 결과가 0건이면 상위 maxItems개 fallback
  }

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
    studioPie: { name: string; value: number }[]; // 트리맵용, 비율 2% 이상, 그외 제외
    actressPie: { name: string; value: number }[]; // 트리맵용, 비율 2% 이상, 그외 제외
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
  min-width: 1080px;
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

  // ECharts 차트 3열 그리드 (카드 내부)
  .charts-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--color-border);
  }

  // ECharts 개별 차트 셀
  .echart-cell {
    display: flex;
    flex-direction: column;
    align-items: center;

    .echart-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 0.35rem;
      text-align: center;
    }

    .echart-container {
      width: 100%;
      height: 300px;
    }
  }

  // Release 카드 total 표기
  .release-total {
    font-weight: 400;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-left: 0.25rem;
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

1. ~~`FlayDashboard.ts` 파일 생성 — 클래스, connectedCallback, 스켈레톤 HTML~~ ✅
2. ~~개별 비동기 API 호출 메서드 4개 구현 (`#loadInstanceCard` 등)~~ ✅
3. ~~각 카드별 통계 계산 + 렌더링 구현~~ ✅
4. ~~Release 월별 분포 ECharts 바 차트 구현 (yAxis max 100, 초과 시 빨간색)~~ ✅
5. ~~의존성 기반 렌더링 (Actress 카드 = Instance + Archive 대기)~~ ✅
6. ~~`FlayDashboard.scss` 스타일 작성~~ ✅
7. ~~ECharts 6.0.0 마이그레이션 — SVG 파이 차트 → ECharts 파이 + 트리맵~~ ✅
8. ~~빌드 확인~~ ✅
