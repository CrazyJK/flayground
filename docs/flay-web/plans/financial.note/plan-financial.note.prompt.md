내 모든 계좌(은행, 보험, 증권 등)에서 현재 잔액/해지환급금/평가금액 등을 한눈에 볼 수 있는 SPA 화면입니다.
금융기관 추가/삭제 및 계좌 추가/삭제 기능이 포함됩니다.
금융기관은 은행, 보험, 증권 등으로 구분됩니다.
계좌는 금융기관에 속하며, 계좌명, 계좌번호, 잔액/해지환급금/평가금액 등의 정보를 포함합니다.
사용자는 금융기관과 계좌를 추가하거나 삭제할 수 있습니다.

은행 계좌는 잔액을 표시하고, 보험 계좌는 해지환급금을 표시하며, 증권 계좌는 평가금액을 표시합니다.

은행과 보험 계좌의 금액은 사용자가 직접 입력해야 하며, 증권 계좌는 상품별 종목코드, 매입단가, 매입수량을 입력하면 현재가는 API를 통해 받아와서 평가금액을 계산하여 표시합니다.
주식의 시가는 `https://m.stock.naver.com/api/stock/395160/integration` 로 API 요청하여 받아올 수 있습니다. (395160은 종목코드입니다.)

입력된 계좌 정보와 수치들은 날짜별로 스냅샷을 저장한다.
스냅샷을 저장할 때는 계좌 정보와 수치들을 날짜별로 저장하여, 사용자가 특정 날짜의 계좌 상태를 조회할 수 있도록 합니다. 스냅샷은 사용자가 원하는 날짜에 저장할 수 있으며, 저장된 스냅샷은 날짜별로 정렬되어 표시됩니다.
사용자는 저장된 스냅샷을 조회하여 특정 날짜의 계좌 상태를 확인할 수 있습니다. 스냅샷 조회 시에는 해당 날짜에 저장된 계좌 정보와 수치들이 표시됩니다.

모든 데이터는 web-backend 에서 관리하며, web-frontend는 API를 통해 데이터를 주고받습니다.
web-backend에서 데이터를 저장은 sqlite를 사용하여 관리합니다.

web-frontend\src\finance 하위에 custom elements로 구현된 컴포넌트, 도메인 정의, 서비스 등을 만들어서 관리

web-frontend\src\view\financial.note.ts 에 web-frontend\src\finance 하위에 만들어진 컴포넌트를 추가하여 화면을 구성

---

## 구현 계획

### 1단계: 백엔드 도메인 및 DB 설계

#### SQLite 테이블 구조

```sql
-- 금융기관
CREATE TABLE IF NOT EXISTS fn_institution (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('bank', 'insurance', 'stock')),
  sort INTEGER NOT NULL DEFAULT 0
);

-- 계좌
CREATE TABLE IF NOT EXISTS fn_account (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER NOT NULL REFERENCES fn_institution(id),
  name           TEXT NOT NULL,
  account_number TEXT,
  amount         REAL NOT NULL DEFAULT 0,
  sort           INTEGER NOT NULL DEFAULT 0
);

-- 증권 계좌 종목 (stock 타입 계좌에 종속)
CREATE TABLE IF NOT EXISTS fn_stock_item (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES fn_account(id),
  code       TEXT NOT NULL,
  name       TEXT,
  buy_price  REAL NOT NULL DEFAULT 0,
  buy_qty    REAL NOT NULL DEFAULT 0
);

-- 스냅샷 헤더
CREATE TABLE IF NOT EXISTS fn_snapshot (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 스냅샷 항목 (계좌별 금액 기록)
CREATE TABLE IF NOT EXISTS fn_snapshot_entry (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id INTEGER NOT NULL REFERENCES fn_snapshot(id),
  account_id  INTEGER NOT NULL,
  name        TEXT NOT NULL,
  amount      REAL NOT NULL DEFAULT 0,
  inst_name   TEXT NOT NULL,
  inst_type   TEXT NOT NULL
);
```

#### 도메인 타입: `web-backend/src/domain/financial-note.ts`

```ts
export type InstitutionType = 'bank' | 'insurance' | 'stock';

export interface Institution {
  id: number;
  name: string;
  type: InstitutionType;
  sort: number;
}

export interface Account {
  id: number;
  institutionId: number;
  name: string;
  accountNumber: string;
  amount: number;
  sort: number;
}

export interface StockItem {
  id: number;
  accountId: number;
  code: string;
  name: string;
  buyPrice: number;
  buyQty: number;
}

export interface SnapshotEntry {
  accountId: number;
  name: string;
  amount: number;
  instName: string;
  instType: InstitutionType;
}

export interface Snapshot {
  id: number;
  date: string;
  createdAt: string;
  entries: SnapshotEntry[];
}
```

---

### 2단계: 백엔드 소스 및 라우트

#### 소스: `web-backend/src/sources/financial-note-repository.ts`

`push-subscription-repo.ts`와 동일한 패턴으로 `better-sqlite3` 사용.

- `initDB()` — DB 파일 열기, 테이블 생성
- 금융기관 CRUD: `getInstitutions`, `addInstitution`, `deleteInstitution`
- 계좌 CRUD: `getAccounts`, `addAccount`, `updateAccountAmount`, `deleteAccount`
- 증권 종목 CRUD: `getStockItems`, `addStockItem`, `deleteStockItem`
- 스냅샷: `saveSnapshot`, `getSnapshotDates`, `getSnapshot`

#### 라우트: `web-backend/src/routes/financial-note.routes.ts`

| 메서드   | 경로                                       | 설명                                 |
| -------- | ------------------------------------------ | ------------------------------------ |
| `GET`    | `/financial-note/institutions`             | 금융기관 목록                        |
| `POST`   | `/financial-note/institutions`             | 금융기관 추가                        |
| `DELETE` | `/financial-note/institutions/:id`         | 금융기관 삭제                        |
| `GET`    | `/financial-note/accounts`                 | 전체 계좌 목록                       |
| `POST`   | `/financial-note/accounts`                 | 계좌 추가                            |
| `PUT`    | `/financial-note/accounts/:id/amount`      | 계좌 금액 수정                       |
| `DELETE` | `/financial-note/accounts/:id`             | 계좌 삭제                            |
| `GET`    | `/financial-note/accounts/:id/stock-items` | 종목 목록                            |
| `POST`   | `/financial-note/accounts/:id/stock-items` | 종목 추가                            |
| `DELETE` | `/financial-note/stock-items/:id`          | 종목 삭제                            |
| `GET`    | `/financial-note/stock-price/:code`        | 주식 현재가 조회 (네이버 API 프록시) |
| `POST`   | `/financial-note/snapshots`                | 스냅샷 저장                          |
| `GET`    | `/financial-note/snapshots`                | 스냅샷 날짜 목록                     |
| `GET`    | `/financial-note/snapshots/:date`          | 특정 날짜 스냅샷 조회                |
| `POST`   | `/financial-note/import/institutions`      | CSV로 기관/계좌 초기 데이터 import   |
| `POST`   | `/financial-note/import/snapshots`         | CSV로 스냅샷 초기 데이터 import      |

- `GET /financial-note/stock-price/:code` — 서버에서 `https://m.stock.naver.com/api/stock/:code/integration` 를 fetch하여 현재가를 추출하고 반환 (CORS 우회 목적)

#### `web-backend/src/index.ts` 수정

```ts
import financialNoteRoutes from './routes/financial-note.routes';
// ...
app.use(API_PREFIX, financialNoteRoutes);
```

---

### 3단계: 프론트엔드 구조

#### 디렉토리: `web-frontend/src/finance/`

```
finance/
  domain/
    financial-note.ts          # 타입 정의 + API 서비스 함수
  components/
    fn-institution-list.ts     # 금융기관 목록 + 계좌 목록 (Custom Element)
    fn-institution-form.ts     # 금융기관/계좌 추가 폼 (Custom Element)
    fn-stock-items.ts          # 증권 종목 편집 (Custom Element)
    fn-snapshot-panel.ts       # 스냅샷 저장/조회 패널 (Custom Element)
    fn-snapshot-chart.ts       # 스냅샷 날짜별 자산 추이 ECharts 차트 (Custom Element)
  financial-note.scss          # 스타일
  index.ts                     # 컴포넌트 등록 export
```

#### 도메인/서비스: `finance/domain/financial-note.ts`

- 타입 재정의 (프론트용): `Institution`, `Account`, `StockItem`, `Snapshot`, `SnapshotEntry`
- API 함수:
  - `fetchInstitutions()`, `addInstitution()`, `deleteInstitution()`
  - `fetchAccounts()`, `addAccount()`, `updateAccountAmount()`, `deleteAccount()`
  - `fetchStockItems()`, `addStockItem()`, `deleteStockItem()`
  - `fetchStockPrice(code)` — 네이버 API 프록시 호출
  - `saveSnapshot()`, `fetchSnapshotDates()`, `fetchSnapshot(date)`

#### 컴포넌트 역할

| 컴포넌트                | 역할                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| `<fn-institution-list>` | 금융기관별 계좌 목록, 합계 표시, 금액 인라인 수정                       |
| `<fn-institution-form>` | 금융기관·계좌 추가 폼 (모달 또는 사이드 패널)                           |
| `<fn-stock-items>`      | 증권 계좌 클릭 시 종목 목록 편집 + 평가금액 실시간 계산                 |
| `<fn-snapshot-panel>`   | 날짜 선택 → 스냅샷 저장, 과거 스냅샷 조회                               |
| `<fn-snapshot-chart>`   | 저장된 스냅샷 날짜를 X축으로 금융기관별/총자산 추이 라인 차트 (ECharts) |

#### 엔트리포인트: `web-frontend/src/view/financial.note.ts`

```ts
import '../finance/financial-note.scss';
import '../finance/index'; // 커스텀 엘리먼트 등록
import './inc/Page';
```

HTML(`public/financial.note.html`)에 커스텀 엘리먼트 태그를 배치하여 화면 구성.

---

### 4단계: 화면 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  Financial Note            총 자산: ₩ 000,000,000   │
├──────────────────────────────┬──────────────────────┤
│  [+ 기관 추가]               │  스냅샷                │
│                              │  날짜: [2026-04-25]   │
│  🏦 국민은행 (은행)           │  [저장]               │
│    ├ 자유입출금 ₩ 0,000,000  │                       │
│    └ 정기예금  ₩ 0,000,000  │  ── 저장된 스냅샷 ──   │
│  소계: ₩ 0,000,000           │  2026-04-01           │
│                              │  2026-03-01           │
│  🛡 삼성생명 (보험)           │  ...                  │
│    └ 종신보험  ₩ 0,000,000  │                       │
│  소계: ₩ 0,000,000           │                       │
│                              │                       │
│  📈 미래에셋 (증권)           │                       │
│    └ CMA     ₩ 0,000,000    │                       │
│       [종목 편집]             │                       │
│  소계: ₩ 0,000,000           │                       │
└──────────────────────────────┴──────────────────────┘
```

---

### CSV Import 형식

#### `financial-init-Institution-Account-StockItem0data.csv`

```
기관,계좌들,,,,,,,,
푸르덴션생명 > KB라이프,변액유니버셜종신_VIP평준,하이브리드변액평생_집중56,...
...
```

- 첫 번째 열: 금융기관명 (`X > Y` 형식 포함)
- 나머지 열: 해당 기관의 계좌명
- 기관 타입 자동 감지: 생명/보험/라이프/Metlife → `insurance`, 은행/뱅크 → `bank`, 그 외 → `stock`

#### `financial-init-snapshot-data.csv`

```
,푸르덴션생명 > KB라이프,,,,...
Date,변액유니버셜종신_VIP평준,...
2019-04-03,"23,446,403",...
```

- 1행: 금융기관명 (스패닝, 빈 열 포함)
- 2행: `Date` + 계좌명 목록
- 3행~: `YYYY-MM-DD` + 금액 (콤마 포함 따옴표 문자열 or 숫자)
- 계좌명으로 기존 DB 계좌와 매칭하여 스냅샷 저장

---

### 구현 순서

1. **백엔드**: `financial-note.ts` (도메인) → `financial-note-repository.ts` (SQLite) → `financial-note.routes.ts` (라우트) → `index.ts` 라우트 등록
2. **프론트엔드**: `domain/financial-note.ts` (타입+서비스) → `fn-institution-list.ts` → `fn-institution-form.ts` → `fn-stock-items.ts` → `fn-snapshot-panel.ts` → `financial-note.ts` (엔트리포인트)
3. **HTML**: `public/financial.note.html` 에 커스텀 엘리먼트 배치 및 스타일 연결
