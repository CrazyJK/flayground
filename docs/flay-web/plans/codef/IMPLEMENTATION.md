# finance-hub 구현 결과

작성일: 2026-04-25

## 개요

codef API를 이용하여 미래에셋증권의 주식계좌 잔고와 거래내역을 조회하는 시스템을 구현하였다.
백엔드는 프로젝트 루트 `finance-hub/`에 독립 서버로 구축하고, 프론트엔드는 `web-frontend`에 금융 페이지를 추가하였다.

---

## 구현 결과물

### Backend (`finance-hub/`)

```
finance-hub/
├── package.json              # 프로젝트 메타 및 의존성
├── tsconfig.json             # TypeScript 컴파일 설정
├── tsup.config.ts            # 빌드 설정
├── .env.example              # 환경변수 템플릿
├── .gitignore                # .env, data/, logs/ 제외
└── src/
    ├── index.ts              # Express 서버 진입점 (포트 4000)
    ├── config.ts             # 환경변수 로딩 및 설정 객체
    ├── codef/
    │   ├── auth.ts           # Access Token 발급 및 7일 캐싱 (메모리 + 파일)
    │   ├── connector.ts      # ConnectedID 생성/조회
    │   └── rsa.ts            # RSA-OAEP 암호화 (node-forge)
    ├── routes/
    │   ├── health.routes.ts  # GET /api/health
    │   └── account.routes.ts # GET /api/accounts/balance, transactions / POST /api/auth/connected-id
    ├── services/
    │   ├── codef.service.ts  # codef HTTP 통신 공통 레이어 (토큰 만료 자동 재시도)
    │   ├── balance.service.ts     # 주식잔고 조회 서비스
    │   └── transaction.service.ts # 거래내역 조회 서비스
    └── middleware/
        ├── error-handler.ts  # 글로벌 에러 핸들러
        └── logger.ts         # morgan 파일 로거
```

#### 사용 기술

| 항목          | 내용                 |
| ------------- | -------------------- |
| 런타임        | Node.js + TypeScript |
| 웹 프레임워크 | Express 4            |
| 빌드 도구     | tsup (ESM 출력)      |
| 개발 서버     | tsx watch            |
| RSA 암호화    | node-forge           |
| 환경변수      | dotenv               |
| 로깅          | morgan               |

#### API Endpoints

| Method | Path                                                                       | 설명                              |
| ------ | -------------------------------------------------------------------------- | --------------------------------- |
| `GET`  | `/api/health`                                                              | 서버 상태 확인                    |
| `GET`  | `/api/accounts/balance`                                                    | 주식잔고 조회                     |
| `GET`  | `/api/accounts/transactions?startDate=YYYYMMDD&endDate=YYYYMMDD&orderBy=0` | 거래내역 조회                     |
| `POST` | `/api/auth/connected-id`                                                   | ConnectedID 신규 생성 (초기 설정) |

#### codef API 연동

| API          | Demo 엔드포인트                                                            | 기관코드          |
| ------------ | -------------------------------------------------------------------------- | ----------------- |
| 주식잔고조회 | `POST https://development.codef.io/v1/kr/stock/a/account/balance-inquiry`  | `0238` (미래에셋) |
| 거래내역조회 | `POST https://development.codef.io/v1/kr/stock/a/account/transaction-list` | `0238` (미래에셋) |

#### 주요 설계 포인트

- **Access Token 캐싱**: 7일 유효한 토큰을 메모리 + `data/token-cache.json` 파일에 이중 캐싱하여 재발급 최소화
- **토큰 만료 자동 재시도**: codef 응답코드 `CF-00401` 감지 시 토큰 무효화 후 1회 자동 재발급
- **RSA 암호화**: 계좌비밀번호를 codef publicKey로 `RSA-OAEP (SHA-256/MGF1-SHA-1)` 암호화, 로그 노출 없음
- **CORS 제한**: `CORS_ORIGINS` 환경변수로 허용 출처 명시

---

### Frontend (`web-frontend/src/finance/`)

```
web-frontend/src/
├── finance/
│   ├── FinanceApi.ts         # finance-hub API fetch 함수 및 포맷 유틸리티
│   ├── FinancePage.ts        # 페이지 루트 커스텀 엘리먼트 (<finance-page>)
│   ├── FinancePage.scss      # 페이지 레이아웃 스타일 (탭 네비게이션 포함)
│   ├── BalancePanel.ts       # 잔고 탭 커스텀 엘리먼트 (<finance-balance>)
│   ├── BalancePanel.scss     # 잔고 패널 스타일 (포트폴리오 요약 카드 + 테이블)
│   ├── TransactionPanel.ts   # 거래내역 탭 커스텀 엘리먼트 (<finance-transaction>)
│   └── TransactionPanel.scss # 거래내역 패널 스타일 (날짜 필터 + 테이블)
└── view/
    ├── page.finance.ts       # webpack entry point
    ├── page.finance.scss     # 페이지 기본 스타일
    └── page.finance.html     # HTML 템플릿
```

#### UI 구성

**잔고 탭 (`BalancePanel`)**

- 포트폴리오 요약 카드: 예수금, 총 매입금액, 총 평가금액, 총 평가손익, 총 수익률
- 종목별 잔고 테이블: 종목명, 코드, 수량, 현재가, 매입금액, 평가금액, 평가손익, 수익률
- 수익률 색상 구분: 수익(빨강), 손실(파랑)

**거래내역 탭 (`TransactionPanel`)**

- 날짜 범위 필터 (기본: 최근 30일)
- 정렬 선택: 최신순 / 과거순
- 거래내역 테이블: 거래일자, 거래시각, 거래구분, 적요, 입금금액, 출금금액, 거래후 잔액

#### webpack 등록

`web-frontend/webpack.common.cjs` `entryPoints.finance` 그룹에 `page.finance` 추가 완료.

---

## 시작 방법

### 1. finance-hub 패키지 설치

```bash
cd finance-hub
yarn install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
# .env 파일에 실제 codef 키와 미래에셋 계좌 정보 입력
```

### 3. ConnectedID 발급 (최초 1회)

서버 기동 후 아래 API를 호출하여 connectedId를 발급받고 `.env`의 `CODEF_CONNECTED_ID`에 저장:

```bash
curl -X POST http://localhost:4000/api/auth/connected-id \
  -H "Content-Type: application/json" \
  -d '{"userId": "미래에셋_아이디", "userPassword": "미래에셋_비밀번호"}'
```

```bat
Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/connected-id" -ContentType "application/json" -Body '{"userId": "미래에셋_아이디", "userPassword": "미래에셋_비밀번호"}'
```

### 4. 서버 기동

```bash
# 개발 모드
yarn dev

# 프로덕션
yarn build && yarn start
```

### 5. 프론트엔드 접속

```
http://localhost:8080/page.finance.html
```

---

## 환경변수 (.env)

| 키                       | 설명                                                    |
| ------------------------ | ------------------------------------------------------- |
| `PORT`                   | 서버 포트 (기본: 4000)                                  |
| `CODEF_CLIENT_ID`        | codef 클라이언트 ID                                     |
| `CODEF_CLIENT_SECRET`    | codef 클라이언트 시크릿                                 |
| `CODEF_PUBLIC_KEY`       | codef RSA 공개키                                        |
| `CODEF_CONNECTED_ID`     | 발급받은 ConnectedID                                    |
| `CODEF_ENV`              | `demo` 또는 `production` (기본: demo)                   |
| `MIRAE_ORGANIZATION`     | 미래에셋증권 기관코드 (기본: 0238)                      |
| `MIRAE_ACCOUNT`          | 계좌번호                                                |
| `MIRAE_ACCOUNT_PASSWORD` | 계좌비밀번호 (평문, 서버 내부에서 RSA 암호화)           |
| `CORS_ORIGINS`           | CORS 허용 출처 (쉼표 구분, 기본: http://localhost:8080) |

---

## 보안 사항

- `.env` 파일은 `.gitignore`에 등록되어 VCS에 포함되지 않음
- 계좌비밀번호는 메모리상 RSA 암호화 후 전송, 로그에 출력되지 않음
- Access Token 파일 캐시(`data/token-cache.json`)도 `.gitignore` 대상
- CORS는 허용 출처 목록으로 제한

---

## 향후 확장 계획

- 다른 금융기관 계좌 추가 (organization 코드만 변경하면 동일 로직 재사용)
- 잔고/거래내역 데이터 DB 저장 및 이력 관리
- 차트 시각화 (ECharts 기반 수익률 추이 등)
- 자동 갱신 (일정 주기 스케줄링)
