---
applyTo: 'web-backend/**'
---

# web-backend 작업 지침

Express 4 기반 REST API 서버. TypeScript로 작성하며 `tsx`(개발) / `tsup`(빌드) 사용.

## 기술 스택

- **런타임**: Node.js 22, TypeScript (ESM)
- **프레임워크**: Express 4
- **DB**: better-sqlite3 (금융 노트, Web Push 구독)
- **기타**: morgan, multer, web-push, cheerio, chokidar

## 디렉토리 구조

```
src/
├── config.ts         # 설정 (config/default.json 로드)
├── index.ts          # Express 앱 진입점
├── domain/           # 공유 타입 정의 (프론트엔드와 공유)
├── middleware/       # 에러 핸들러, 로거
├── routes/           # 라우트 핸들러 (*.routes.ts)
├── services/         # 비즈니스 로직 서비스
└── sources/          # 데이터 소스 (파일 시스템, SQLite)
```

## 주요 API 도메인

| 경로                                               | 설명               |
| -------------------------------------------------- | ------------------ |
| `/api/v1/flay`                                     | Flay 영상 관리     |
| `/api/v1/actress`, `/api/v1/studio`, `/api/v1/tag` | 메타 정보          |
| `/api/v1/financial-note`                           | 금융 노트          |
| `/api/v1/stock-price`                              | 주식 현재가        |
| `/api/v1/stream`                                   | 비디오 스트리밍    |
| `/api/v1/push`                                     | Web Push           |
| `/api/v1/sse`                                      | Server-Sent Events |

## 데이터 파일 경로 (항상 `web-backend/` 기준)

| 파일                         | 설명                    |
| ---------------------------- | ----------------------- |
| `data/financial-note.db`     | 금융 노트 SQLite DB     |
| `data/push-subscriptions.db` | Web Push 구독 SQLite DB |
| `config/default.json`        | 경로·포트·SSL 설정      |
| `logs/access.log`            | HTTP 접근 로그          |

## 코딩 관행

- `domain/` 타입은 프론트엔드(`@domain/*`)와 공유되므로 변경 시 영향 범위 확인
- 라우트는 `*.routes.ts`, 비즈니스 로직은 `services/`, 데이터 접근은 `sources/`로 분리
- HTTP 에러는 `middleware/error-handler.ts`의 `HttpError` 사용

## 스크립트

```bash
yarn dev           # tsx watch 개발 서버
yarn build         # tsup 프로덕션 빌드 (dist/)
yarn start         # node dist/index.js 실행
yarn build:schema  # Swagger 스키마 자동 생성
```
