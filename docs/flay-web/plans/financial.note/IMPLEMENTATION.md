# Financial Note 구현 결과

구현 완료 일시: 2026-04-25

## 생성/수정된 파일 목록

### 백엔드 (`web-backend/`)

| 파일                                       | 상태 | 설명                                                                        |
| ------------------------------------------ | ---- | --------------------------------------------------------------------------- |
| `src/domain/financial-note.ts`             | 신규 | 도메인 타입 정의 (Institution, Account, StockItem, Snapshot, SnapshotEntry) |
| `src/sources/financial-note-repository.ts` | 신규 | better-sqlite3 기반 SQLite CRUD 저장소                                      |
| `src/routes/financial-note.routes.ts`      | 신규 | REST API 라우트 14개 + CSV import 2개                                       |
| `src/index.ts`                             | 수정 | financialNoteRoutes 등록, financialNoteRepository.init() 호출               |

### 프론트엔드 (`web-frontend/`)

| 파일                                            | 상태 | 설명                                                     |
| ----------------------------------------------- | ---- | -------------------------------------------------------- |
| `src/finance/domain/financial-note.ts`          | 신규 | 타입 정의 + API 서비스 함수 전체                         |
| `src/finance/components/fn-institution-list.ts` | 신규 | 금융기관별 계좌 목록 Custom Element                      |
| `src/finance/components/fn-institution-form.ts` | 신규 | 기관/계좌 추가 폼 + CSV import Custom Element            |
| `src/finance/components/fn-stock-items.ts`      | 신규 | 증권 종목 편집 + 평가금액 계산 Custom Element            |
| `src/finance/components/fn-snapshot-panel.ts`   | 신규 | 스냅샷 저장/조회 패널 Custom Element                     |
| `src/finance/components/fn-snapshot-chart.ts`   | 신규 | ECharts 라인 차트 Custom Element                         |
| `src/finance/financial-note.scss`               | 신규 | 전체 스타일 (테마 변수 사용)                             |
| `src/finance/index.ts`                          | 신규 | 컴포넌트 export 모음                                     |
| `src/view/financial.note.ts`                    | 수정 | 엔트리포인트 — 컴포넌트 로드, 이벤트 연결                |
| `src/view/financial.note.html`                  | 수정 | 커스텀 엘리먼트 배치 HTML 템플릿                         |
| `src/nav/SideNavBar.ts`                         | 수정 | `page.finance.html` → `financial.note.html` 로 메뉴 수정 |

---

## API 엔드포인트 목록

Base URL: `/api/v1/financial-note`

### 금융기관

- `GET    /institutions` — 목록 조회
- `POST   /institutions` — 추가 `{ name, type: 'bank'|'insurance'|'stock' }`
- `DELETE /institutions/:id` — 삭제 (연관 계좌/종목/스냅샷 항목 포함)

### 계좌

- `GET    /accounts` — 전체 목록
- `GET    /institutions/:institutionId/accounts` — 기관별 목록
- `POST   /accounts` — 추가 `{ institutionId, name, accountNumber? }`
- `PUT    /accounts/:id/amount` — 금액 수정 `{ amount }`
- `DELETE /accounts/:id` — 삭제

### 증권 종목

- `GET    /accounts/:id/stock-items` — 계좌별 목록
- `POST   /accounts/:id/stock-items` — 추가 `{ code, name?, buyPrice, buyQty }`
- `DELETE /stock-items/:id` — 삭제

### 주식 현재가

- `GET    /stock-price/:code` — 네이버 API 프록시 (`code`: 6자리 종목코드) → `{ code, price }`

### 스냅샷

- `GET    /snapshots` — 날짜 목록 (최신순)
- `GET    /snapshots/summaries` — 날짜별 기관별 합계 (차트용)
- `GET    /snapshots/:date` — 특정 날짜 스냅샷 조회
- `POST   /snapshots` — 저장 `{ date, entries[] }`

### CSV Import

- `POST   /import/institutions` — 기관/계좌 CSV import `{ csv: string }`
- `POST   /import/snapshots` — 스냅샷 CSV import `{ csv: string }`

---

## SQLite DB 구조

DB 파일: `web-backend/data/financial-note.db`

```
fn_institution   — 금융기관 (id, name, type, sort)
fn_account       — 계좌 (id, institution_id, name, account_number, amount, sort)
fn_stock_item    — 증권 종목 (id, account_id, code, name, buy_price, buy_qty)
fn_snapshot      — 스냅샷 헤더 (id, date UNIQUE, created_at)
fn_snapshot_entry — 스냅샷 항목 (id, snapshot_id, account_id, name, amount, inst_name, inst_type)
```

---

## CSV Import 사용법

### 기관/계좌 import

`fn-institution-form` 컴포넌트 → "CSV Import" 섹션 → "기관/계좌 CSV" 파일 선택 후 import.

형식: `financial-init-Institution-Account-StockItem0data.csv`

- 1행: 헤더 (건너뜀)
- 2행~: `기관명, 계좌1, 계좌2, ...`
- 기관 타입 자동 감지: 생명/보험/라이프/Metlife → `insurance`, 은행/뱅크 → `bank`, 그 외 → `stock`

### 스냅샷 import

기관/계좌 import 완료 후, "스냅샷 CSV" 파일 선택 후 import.

형식: `financial-init-snapshot-data.csv`

- 1행: 기관명 스패닝 헤더
- 2행: `Date, 계좌명1, 계좌명2, ...`
- 3행~: `YYYY-MM-DD, 금액1, 금액2, ...`

---

## 이벤트 흐름

```
fn-institution-form
  → fn:data-changed  →  fn-institution-list.refresh()

fn-institution-list
  → fn:edit-stock    →  fn-stock-items 모달 오픈 (account-id 설정)

fn-stock-items
  → fn:stock-eval-updated  →  fn-institution-list.updateStockAmount()
  → fn:data-changed        →  fn-institution-list.refresh()

fn-snapshot-panel
  → [저장] 버튼  →  현재 계좌 정보 스냅샷 저장
  → fn:snapshot-saved  →  fn-snapshot-chart.load()
```
