# codef이용 계좌조회

codef API를 이용하여 계좌 조회
조회할 계좌는 미래에셋증권의 주식계좌이고, 차후 다른 금융기관의 계좌도 조회할 수 있도록 확장할 예정

## key

증권사 코드

- 미래에셋증권 0238

codef의 샌드박스와 데모버전 사용중. 정식버전은 아직 미신청 상태

codef 회원가입과 key 발급은 완료

- public_key
- client_id
- client_secret

## Access Token 발급

codef api 문서: https://developer.codef.io/common-guide/rest-api

URL: https://oauth.codef.io/oauth/token

Method: POST

Authorization: Basic Auth → client_id, client_secret 입력

Body:

```json
{
  "grant_type": "client_credentials",
  "client_id": "발급받은 client_id",
  "client_secret": "발급받은 client_secret",
  "scope": "read"
}
```

## ConnectedID 생성

URL: https://development.codef.io/v1/account/create

Method: POST

Headers:

Authorization: Bearer {access_token}

Content-Type: application/json

Body 예시:

```json
{
  "accountList": [
    {
      "countryCode": "KR",
      "businessType": "BK",
      "clientType": "P",
      "organization": "0004",
      "loginType": "1",
      "id": "은행 아이디",
      "password": "RSA 암호화된 비밀번호"
    }
  ]
}
```

ConnectedID: 사용자의 인증 정보를 기반으로 CODEF가 발급하는 고유 식별자

## 계좌 조회 요청

URL: https://development.codef.io/v1/kr/bank/p/account/transaction

Method: POST

Headers:

Authorization: Bearer {access_token}

Content-Type: application/json

Body 예시:

```json
{
  "connectedId": "발급받은 ConnectedID",
  "organization": "0004",
  "account": "계좌번호",
  "startDate": "20240101",
  "endDate": "20240425",
  "orderBy": "desc"
}
```

응답: 거래 내역 JSON 반환 (입출금 내역, 잔액 등)

## 주식잔고조회 API

codef api 문서: https://developer.codef.io/products/stock/common/a/balance-inquiry

## PLAN

### 개요

codef API를 이용하여 미래에셋증권의 주식계좌 거래 내역과 잔고를 조회하는 기능을 구현합니다.
백엔드는 프로젝트 루트에 신규 폴더 **`finance-hub`** 로 독립 서버를 구축하고, 프론트엔드는 `web-frontend`에 계좌 조회 UI를 추가합니다.

> 폴더명 `finance-hub`를 선택한 이유: 미래에셋증권 외 다른 금융기관도 포함 가능한 "금융 데이터 허브" 역할을 명시하기 위함

---

### Backend (`finance-hub`)

#### 기술 스택

- Node.js + TypeScript + Express (`web-backend` 패턴 참조)
- `tsx` (개발 서버), `tsup` (빌드)
- `node-forge` 또는 `crypto` 내장 모듈 (RSA 암호화)
- `dotenv` (환경변수 관리)

#### 디렉토리 구조

```
finance-hub/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .env                     # 환경변수 (gitignore 대상)
├── .env.example             # 환경변수 예시
├── data/                    # 캐시 데이터 (토큰 등)
├── logs/
└── src/
    ├── index.ts             # 서버 진입점
    ├── config.ts            # 환경변수 로딩 및 설정
    ├── codef/
    │   ├── auth.ts          # Access Token 발급 및 캐싱 (7일 유효)
    │   ├── connector.ts     # ConnectedID 관리 (생성/조회)
    │   └── rsa.ts           # publicKey로 RSA 암호화 유틸리티
    ├── routes/
    │   ├── account.routes.ts   # 계좌 관련 API 라우트
    │   └── health.routes.ts    # 서버 상태 확인
    ├── services/
    │   ├── codef.service.ts    # codef API HTTP 통신 공통 레이어
    │   ├── balance.service.ts  # 주식잔고조회 비즈니스 로직
    │   └── transaction.service.ts # 거래내역조회 비즈니스 로직
    └── middleware/
        ├── error-handler.ts
        └── logger.ts
```

#### 인증 흐름

1. **Access Token 발급**
   - `clientId` + `clientSecret` → Base64 인코딩 → Basic Auth
   - `POST https://oauth.codef.io/oauth/token` (grant_type: client_credentials)
   - 토큰은 7일 유효 → 만료 전까지 재사용 (파일/메모리 캐싱)
2. **ConnectedID 생성** (최초 1회)
   - 사용자 인증 정보 등록
   - `POST https://development.codef.io/v1/account/create`
   - 발급된 connectedId는 환경변수 또는 파일로 저장
3. **RSA 암호화**
   - 계좌비밀번호는 codef `publicKey`로 RSA 암호화 후 전송

#### API Endpoints (finance-hub 서버)

| Method | Path                         | 설명                                              |
| ------ | ---------------------------- | ------------------------------------------------- |
| `GET`  | `/api/health`                | 서버 상태 확인                                    |
| `GET`  | `/api/accounts/balance`      | 주식잔고 조회                                     |
| `GET`  | `/api/accounts/transactions` | 거래내역 조회 (쿼리: startDate, endDate, orderBy) |
| `POST` | `/api/auth/connected-id`     | ConnectedID 신규 생성 (초기 설정 용도)            |

#### codef API 연동 상세

**주식잔고조회**

- Demo: `POST https://development.codef.io/v1/kr/stock/a/account/balance-inquiry`
- 기관코드(미래에셋증권): `0238`
- 입력: `organization`, `connectedId`, `account`, `accountPassword(RSA 암호화)`
- 출력: 예수금, 종목별 잔고 (수량, 현재가, 평가금액, 평가손익, 수익률)

**주식 거래내역(입출금내역) 조회**

- Demo: `POST https://development.codef.io/v1/kr/stock/a/account/transaction-list`
- 기관코드(미래에셋증권): `0238`
- 입력: `organization`, `connectedId`, `account`, `accountPassword(RSA 암호화)`, `startDate`, `endDate`, `orderBy`
- 출력: 거래일자, 거래시각, 입금금액, 출금금액, 거래후잔액, 거래내역 비고(1~4)

#### 환경변수 (.env)

```env
PORT=4000

# codef 인증 정보
CODEF_CLIENT_ID=발급받은_client_id
CODEF_CLIENT_SECRET=발급받은_client_secret
CODEF_PUBLIC_KEY=발급받은_public_key

# 미래에셋증권 계좌 정보
MIRAE_ORGANIZATION=0238
MIRAE_ACCOUNT=계좌번호
MIRAE_ACCOUNT_PASSWORD=계좌비밀번호_평문

# ConnectedID (최초 생성 후 저장)
CODEF_CONNECTED_ID=발급받은_connectedId

# 환경 (demo / production)
CODEF_ENV=demo
```

#### 보안 고려사항

- `.env` 파일은 `.gitignore`에 추가 (계좌 정보 노출 방지)
- 계좌비밀번호는 메모리상 RSA 암호화 후 즉시 폐기, 로그에 절대 출력하지 않음
- Access Token은 파일 캐싱 시 앱 전용 디렉토리(`data/`)에 저장
- CORS는 `web-frontend` 출처만 허용

---

### Frontend (`web-frontend`)

#### 추가 위치

webpack entry point: `web-frontend/src/view/page.finance.ts`

#### 구성 컴포넌트

```
web-frontend/src/
└── finance/
    ├── FinancePage.ts        # 페이지 메인. custom element로 개발.
    ├── FinancePage.scss
    ├── BalancePanel.ts       # 주식잔고 패널
    ├── BalancePanel.scss
    ├── TransactionPanel.ts   # 거래내역 패널
    └── TransactionPanel.scss
└── view/
    ├── page.finance.ts        # webpack entry point. FinancePage.ts를 import하여 custom element로 등록
    ├── page.finance.scss
    └── page.finance.html
```

#### UI 구성

1. **포트폴리오 요약 카드**
   - 총 평가금액, 총 매입금액, 총 평가손익, 총 수익률

2. **종목별 잔고 테이블**
   - 종목명, 종목코드, 수량, 현재가, 매입금액, 평가금액, 평가손익, 수익률(%)
   - 수익률 기준 색상 구분 (수익: 빨강/손실: 파랑)

3. **거래내역 테이블**
   - 날짜 범위 필터 (startDate ~ endDate)
   - 거래일자, 거래내역 구분, 입금금액, 출금금액, 거래후 잔액

#### API 연동

- `finance-hub` 서버(포트 4000)에 `fetch`로 데이터 요청
- 로딩 상태, 에러 상태 처리

---

### 구현 순서

1. `finance-hub` 프로젝트 초기 설정 (package.json, tsconfig, tsup 등)
2. codef 인증 모듈 구현 (토큰 발급, RSA 암호화)
3. ConnectedID 생성 및 관리
4. 잔고조회 / 거래내역조회 서비스 구현
5. Express 라우트 및 미들웨어 연결
6. `web-frontend` 금융 페이지 UI 구현
7. 통합 테스트 (demo 환경)
