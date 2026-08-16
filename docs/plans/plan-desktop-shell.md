# 계획: flay-desktop — Electron 데스크톱 셸

> 작성일: 2026-07-17
> 목표: flayground와 flayAI를 하나의 데스크톱 앱으로 감싸 PC 자원(파일, 외부 프로그램, OS 기능)에 직접 접근한다.

## 결정 사항

| 항목        | 결정                                                       |
| ----------- | ---------------------------------------------------------- |
| 셸 기술     | **Electron** (Chromium 내장. WebView2 아님 — Node 메인 프로세스로 기존 TS/yarn 역량 활용) |
| 위치        | **`flayground/desktop-shell/`** 서브 프로젝트              |
| 네이티브 기능 | 파일/폴더 직접 접근, 외부 프로그램 실행, 프로세스 오케스트레이션, OS 통합(트레이/단축키) |

## 현재 구조 (전제)

- **flayground**: Express 백엔드가 API + 정적 프론트 서빙. `.cert` 자체 서명 인증서로 `https://flay.kamoru.jk[:port]` 기동 (`flay-web/backend/config/default.json`).
- **flayAI**: FastAPI(`:8000`) + Next.js(`:3000`) + Qdrant(Docker `:6333`) + Ollama(`:11434`). `bin\all.bat start|stop|status`로 제어.
- 둘 다 localhost 웹앱이므로 **프론트엔드 코드 이식 없이** 셸이 기존 URL을 로드한다. 브라우저로 쓰던 방식도 그대로 유지된다(셸은 부가 레이어).

## 아키텍처

```
desktop-shell/
├── src/
│   ├── main/
│   │   ├── index.ts          # 앱 진입점, 창/탭 관리
│   │   ├── process-manager.ts # 백엔드 기동/헬스체크/종료
│   │   ├── native-api.ts     # IPC 핸들러 (파일, 외부 실행)
│   │   └── tray.ts           # 트레이, 전역 단축키, 자동시작
│   └── preload/
│       └── index.ts          # contextBridge → window.flayShell
├── package.json              # electron, electron-builder / tsup 빌드
└── electron-builder.yml
```

- **창 구성**: 메인 창 하나에 상단 탭 바(WebContentsView 전환) — 탭1: flayground, 탭2: flayAI(`:3000`). 필요 시 창 분리.
- **네이티브 브릿지**: `contextIsolation: true`, `nodeIntegration: false`. preload의 `contextBridge`로 `window.flayShell` 노출. 일반 브라우저에서는 `undefined`이므로 프론트엔드는 **기능 감지**(`if (window.flayShell)`)로 안전하게 분기.
- **인증서**: 자체 서명 인증서이므로 `app.on('certificate-error')`에서 `flay.kamoru.jk` 호스트만 예외 허용.

### window.flayShell API (초안)

| 메서드                          | 기능                                        |
| ------------------------------- | ------------------------------------------- |
| `openPath(path)`                | 파일 탐색기에서 열기 (`shell.showItemInFolder`) |
| `openWith(path, program?)`      | 외부 플레이어(PotPlayer 등)로 실행          |
| `selectFile/Folder(options)`    | 네이티브 파일/폴더 다이얼로그               |
| `readFile/writeFile(path)`      | 백엔드 API를 거치지 않는 임의 경로 접근     |
| `getDroppedPath(file)`          | 드래그앤드롭된 File의 실제 경로             |
| `notify(title, body)`           | OS 네이티브 알림                            |

### 프로세스 오케스트레이션

- 앱 시작 → 포트 점유 확인 → 미기동 서비스만 기동:
  - flayground: `node flay-web/backend/dist/index.js` (또는 개발 모드 시 기존 실행 재사용)
  - flayAI: `bin\all.bat start` 호출 (Qdrant는 Docker Desktop 의존 → 미실행 시 기동하지 않고 상태만 표시)
- 헬스체크 폴링 후 탭 로드. 앱 종료 시 **셸이 직접 띄운 프로세스만** 정리(기존 실행 중이던 것은 유지).
- 트레이 메뉴에서 서비스별 상태 확인 / 재시작.

## 단계별 계획

```
1. 스캐폴드: desktop-shell/ 생성, 탭 2개로 두 앱 URL 로드 (인증서 예외 포함)
   → 검증: yarn dev로 창에서 flayground·flayAI 정상 렌더
2. 프로세스 오케스트레이션: process-manager + 헬스체크 + 종료 정리
   → 검증: 모든 서비스 미기동 상태에서 앱 실행 → 자동 기동 확인, 종료 시 프로세스 정리 확인
3. 네이티브 브릿지: preload + IPC (openPath, openWith, 파일 다이얼로그, 드래그앤드롭 경로)
   → 검증: flayground 프론트에서 window.flayShell로 탐색기 열기·외부 플레이어 실행
4. OS 통합: 트레이 상주, 전역 단축키, 부팅 시 자동 시작, 네이티브 알림
   → 검증: 창 닫기 → 트레이 유지, 단축키로 창 토글
5. 패키징: electron-builder (NSIS 또는 portable)
   → 검증: 빌드 산출물 단독 실행으로 1~4 재확인
6. 프론트엔드 점진 통합: 기능 감지 기반으로 셸 전용 UI 활성화 (예: Flay 카드에서 "탐색기에서 열기")
   → 검증: 브라우저에서는 기존 동작 그대로, 셸에서는 확장 기능 동작
```

## 리스크 / 미결

- **flayAI Next.js 운영 방식**: 셸에서 dev 서버를 띄울지, production 빌드(`next start`)로 갈지 → flayAI 쪽에서 결정 필요.
- **Docker 의존**: Qdrant는 Docker Desktop이 꺼져 있으면 flayAI 검색 기능 불가 → 셸은 상태 표시까지만 담당.
- **web-push**: flayground의 Web Push는 Electron에서 동작 방식이 다름 → 셸에서는 네이티브 알림(`notify`)으로 대체 검토.
- **배포 용량**: Electron 특성상 ~200MB. 개인용 앱이므로 수용.
