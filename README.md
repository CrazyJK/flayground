# Flay-Ground

영화 콘텐츠 관리 및 스트리밍 웹 애플리케이션

## 소개

Flay-Ground는 영화 콘텐츠를 관리하기 위한 Node.js 기반 풀스택 웹 애플리케이션입니다.
비디오 파일 구성·분류·태그·스트리밍, 이미지 갤러리, 다이어리, 금융 노트 등 다양한 기능을 제공합니다.

## 주요 기능

- 영화 콘텐츠 관리 및 분류 (Flay, Archive, Storage, Queue)
- 태그·스튜디오·배우 정보 관리
- 비디오 스트리밍 (HTTP/2 + HTTPS)
- 이미지 갤러리
- 다이어리 기능
- 금융 노트 (기관/계좌/증권 종목·스냅샷 관리, SQLite)
- Web Push 알림
- AI 포트폴리오 현황 조회 (국내 주식·퇴직연금 현재가)
- MCP(Model Context Protocol) AI 라우터

## 시스템 요구사항

- Node.js 22 이상
- yarn (`npm install -g yarn`)
- 최신 웹 브라우저 (Chrome, Edge 등)

## 프로젝트 구조

```
flayground/
├── web-backend/     # Node.js + Express 백엔드 서버 (TypeScript)
├── web-frontend/    # Webpack + TypeScript 프론트엔드
├── mcp-nexus/       # MCP AI 라우터 서버 (Gemini / GitHub Models)
├── playwright/      # E2E 테스트
├── bin/             # 실행 스크립트
└── doc/             # 문서
```

## 빠른 시작

각 서브 프로젝트 디렉토리에서 의존성을 설치한 후 개발 서버를 실행합니다.

```bash
# 의존성 설치 (각 디렉토리에서)
yarn install

# 개발 서버 실행
yarn dev

# 프로덕션 빌드
yarn build

# 프로덕션 서버 실행
yarn start
```

---

## web-backend

Express 기반 REST API 서버입니다.

### 주요 기술

- **런타임**: Node.js 22, TypeScript (tsx / tsup)
- **프레임워크**: Express 4
- **DB**: better-sqlite3 (금융 노트, Web Push 구독)
- **기타**: morgan, multer, web-push, cheerio, chokidar

### 스크립트

| 명령어              | 설명                         |
| ------------------- | ---------------------------- |
| `yarn dev`          | tsx watch 개발 서버 실행     |
| `yarn build`        | tsup 프로덕션 빌드 (`dist/`) |
| `yarn start`        | `node dist/index.js` 실행    |
| `yarn build:schema` | Swagger 스키마 자동 생성     |

### 주요 API 도메인

- `/api/v1/flay` — Flay 영상 관리
- `/api/v1/actress`, `/api/v1/studio`, `/api/v1/tag` — 메타 정보
- `/api/v1/financial-note` — 금융 노트
- `/api/v1/stock-price` — 주식 현재가 조회
- `/api/v1/stream` — 비디오 스트리밍
- `/api/v1/push` — Web Push
- `/api/v1/sse` — Server-Sent Events

### 환경 설정

`web-backend/config/default.json` 파일에서 경로·포트·SSL 등을 설정합니다.

### 데이터 파일 경로 (항상 `web-backend/` 기준)

| 파일                         | 설명                    |
| ---------------------------- | ----------------------- |
| `data/financial-note.db`     | 금융 노트 SQLite DB     |
| `data/push-subscriptions.db` | Web Push 구독 SQLite DB |
| `logs/access.log`            | HTTP 접근 로그          |

---

## web-frontend

Webpack + TypeScript 기반 멀티 엔트리 SPA 프론트엔드입니다.

### 주요 기술

- **번들러**: Webpack 5
- **언어**: TypeScript, SCSS
- **컴포넌트**: 커스텀 엘리먼트(Web Components)
- **라이브러리**: ECharts, Toast UI Editor, D3 Hierarchy

### 스크립트

| 명령어            | 설명                      |
| ----------------- | ------------------------- |
| `yarn dev`        | 개발 빌드 + 파일 감시     |
| `yarn build`      | 프로덕션 빌드 (`public/`) |
| `yarn lint`       | ESLint 자동 수정          |
| `yarn type-check` | TypeScript 타입 검사      |
| `yarn format`     | Prettier 포맷             |

### 주요 모듈

| 디렉토리       | 설명                                    |
| -------------- | --------------------------------------- |
| `src/flay/`    | Flay 콘텐츠 핵심 기능                   |
| `src/finance/` | 금융 노트 (기관·계좌·스냅샷·포트폴리오) |
| `src/diary/`   | 다이어리                                |
| `src/image/`   | 이미지 갤러리                           |
| `src/movie/`   | 영상 재생                               |
| `src/pension/` | 연금 플래너                             |
| `src/ai/`      | AI 연동                                 |
| `src/view/`    | 페이지별 진입점                         |

---

## mcp-nexus

Google Gemini 및 GitHub Models를 통합하는 MCP(Model Context Protocol) AI 라우터 서버입니다.
Shuffle Bag 방식의 로드 밸런싱으로 요청을 분산합니다.

### 주요 기술

- **런타임**: Node.js, TypeScript
- **AI 제공자**: Google Gemini, GitHub Models (OpenAI 호환)
- **프로토콜**: MCP(stdio), HTTP(Express)

### 스크립트

| 명령어             | 설명                                   |
| ------------------ | -------------------------------------- |
| `yarn dev`         | HTTP 서버 개발 모드 (`http-server.ts`) |
| `yarn dev:stdio`   | MCP stdio 개발 모드                    |
| `yarn build`       | tsup 프로덕션 빌드                     |
| `yarn start`       | HTTP 서버 실행                         |
| `yarn start:stdio` | MCP stdio 서버 실행                    |

### 환경 변수 (`.env`)

```env
GEMINI_API_KEY=...
GITHUB_TOKEN=...
```

### 데이터 파일 경로 (항상 `mcp-nexus/` 기준)

| 파일                    | 설명             |
| ----------------------- | ---------------- |
| `logs/model-stats.json` | 모델별 호출 통계 |

---

## 실행 스크립트

```bash
# Windows
bin/FlayGroundStartup.bat

# Linux / macOS
bin/FlayGroundStartup.sh
```

## 라이선스

MIT

## 소개

Flay-Ground는 영화 콘텐츠를 관리하기 위한 웹 기반 애플리케이션입니다. 비디오 파일을 구성하고, 분류하고, 태그를 지정하며, 스트리밍할 수 있습니다.

## 주요 기능

- 영화 콘텐츠 관리 및 분류
- 태그 및 스튜디오별 콘텐츠 구성
- 비디오 스트리밍
- 이미지 갤러리
- 메모 기능
- 다이어리 기능
- 배우 및 스튜디오 정보 관리

## 시스템 요구사항

- Java 17 이상
- 최신 웹 브라우저 (Chrome, Firefox, Edge 등)
- Maven 3.6 이상 (빌드용)
- Node.js 및 yarn (프론트엔드 개발용)

## 설치 방법

### 사전 준비

1. Java 17 설치
2. Maven 설치
3. Node.js 및 yarn 설치 (`npm install -g yarn`)

### 빌드 및 실행

```bash
# 백엔드 빌드
mvn clean package

# 프론트엔드 빌드
cd www
yarn install

# 스크립트 명령어 (package.json)
yarn start # 개발 서버 실행
yarn build # 프로덕션 빌드
yarn build:dev # 개발용 빌드
yarn build:analyze # 번들 분석 보고서와 함께 빌드
yarn watch # 파일 변경 감시 모드
yarn lint # ESLint를 통한 코드 검사 및 수정

# 애플리케이션 실행
# Windows
bin/FlayGroundStartup.bat

# Linux/Mac
bin/FlayGroundStartup.sh
```

## 환경 설정

`src/main/resources` 디렉토리의 다양한 프로퍼티 파일을 통해 환경별 설정이 가능합니다:

- `application-env-dev.properties`: 개발 환경 설정
- `application-env-prod.properties`: 운영 환경 설정
- `application-env-ssl.properties`: SSL 설정
- `application-ground-*.properties`: 플랫폼별 설정 (Mac, WSL 등)

## SSL 설정

SSL 설정은 `cert` 디렉토리의 문서를 참고하세요. 자체 서명된 인증서 생성 방법 및 CA 서명 인증서 설정 방법을 제공합니다.

## 프로젝트 구조

- `src/main/java`: Java 백엔드 코드
- `src/main/resources`: 애플리케이션 설정 및 정적 파일
- `www/src`: 프론트엔드 JavaScript 코드
- `bin`: 실행 스크립트
- `doc`: 문서 파일
- `logs`: 로그 파일

## 개발 가이드

### 백엔드

Spring Boot 기반의 RESTful API를 제공합니다. 주요 패키지는 다음과 같습니다:

- `jk.kamoru.ground.info`: 비디오, 태그, 스튜디오 등의 정보 관리
- `jk.kamoru.ground.stream`: 미디어 스트리밍 처리
- `jk.kamoru.ground.todayis`: 오늘의 정보 관리
- `jk.kamoru.ground.memo`: 메모 관리

### 프론트엔드

프론트엔드는 모듈식 구조로 구성되어 있습니다:

- `flay`: 핵심 기능 (도메인, 패널, 네비게이션)
- `attach`: 파일 첨부 기능
- `diary`: 다이어리 기능
- `image`: 이미지 관리
- `ui`: 재사용 가능한 UI 컴포넌트

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 버전 정보

현재 버전: 6.9.7.4-24

## 연락처

- 개발자: kamoru
- 이메일: [Crazy.4.JK@gmail.com](Crazy.4.JK@gmail.com)
- GitHub: [https://github.com/kamoru/flayground](https://github.com/kamoru/flayground)

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 기능 브랜치를 만듭니다 (`git checkout -b feature/amazing-feature`)
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다.

## 향후 계획

향후 개발 계획은 [TODO.md](doc/TODO.md) 파일을 참조하세요.
