# flay-web AI 채팅 페이지 (flay-ai 연동) 구현 계획

flay-web 프론트에 `page.flay-ai` 엔트리를 추가해 flay-ai 의 RAG 채팅(`POST /api/chat`, SSE)을
flay-web UI 로 제공한다. 검색 결과 영상은 `FlayCard` 로 렌더한다.

## 확인된 사실 (코드 기준)

| 항목 | 내용 |
| --- | --- |
| 채팅 API 계약 | `POST https://ai.kamoru.jk:8000/api/chat`, body `{query, limit, kind?}` — SSE 이벤트 `tool_call` / `tool_result` / `token` / `done` / `error` (`packages/rag/router.py` 와 공유) |
| hit 구조 | `tool_result.result` 는 `list` 또는 `{items: [...]}`, 각 hit 에 `opus`, `kind`, `score` 등 포함 |
| FlayCard | `new FlayCard().set(opus)` → 내부에서 `FlayFetch.getFullyFlay(opus)` 로 flay-web backend 에서 상세 로드. flay-ai 가 준 제목·배우 메타는 카드 렌더에 불필요, **opus 만 있으면 됨**. 미존재 opus 는 `notfound()` 표시 |
| 엔트리 등록 | `webpack.common.cjs` 의 `entryPoints.pages` 에 등록 + `src/view/page.flay-ai.{html,ts,scss}` 3종. HtmlWebpackPlugin 이 JS/CSS 자동 주입, 엔트리 html 은 `import './inc/Page'` + `<main>` 패턴 |
| 네비게이션 | `src/nav/SideNavBar.ts` 메뉴 배열에 추가 |
| CORS | flay-ai `config.yaml` 의 `server.cors_origins` 에 `https://flay.kamoru.jk` **없음** → 추가 필요(적용에 8000 재시작) |
| 인증서 | 두 서비스가 루트 `.cert/` 공유, 둘 다 HTTPS → mixed content 없음 |

## 가정

1. 엔트리 파일은 저장소 관례에 따라 **TypeScript**(`page.flay-ai.ts`)로 만든다. 요청의
   `page.flay-ai.js` 는 엔트리 이름으로 이해한다(빌드 산출물은 `page.flay-ai.js`).
2. 범위는 **채팅 검색 하나**다. flay-ai 웹의 다른 페이지(이미지·얼굴·일기 등)는 포함하지 않는다.
3. 대화 history 는 보내지 않는다(flay-ai 웹도 미사용, 서버 라우팅도 단발 질의 기준).
4. **`kind: "instance"` 고정(확정).** flay-web 에서는 인스턴스만 대상으로 한다.
   `FlayFetch.getFullyFlay` 가 instance 전용이라 archive opus 는 카드가 notfound 로 뜨는 구조적 이유도 있다.

## 변경 파일

### flay-ai (설정 1건)

- `flay-ai/config.yaml` — `server.cors_origins` 에 `https://flay.kamoru.jk` 추가. **8000 재시작 필요.**

### flay-web/frontend (신규 5건)

| 파일 | 내용 |
| --- | --- |
| `src/ai/flayAiChat.ts` | flay-ai 채팅 클라이언트. `fetch` + `ReadableStream` 으로 POST SSE 파싱(EventSource 는 POST 불가), `AbortController` 중단 지원, 이벤트 타입(`ChatEvent`, `VideoHit`) 정의. `API_BASE` 는 `index-proxy.ts` 처럼 상수(`https://ai.kamoru.jk:8000`) |
| `src/ai/FlayAiChatPanel.ts` + `.scss` | 채팅 패널 Web Component. 베이스 클래스·패턴은 `.claude/skills/web-frontend-component` 를 따른다. 질문 말풍선 → tool_call 조건 칩 → FlayCard 그리드 → 요약 한 줄 순으로 대화 누적, 하단 고정 composer(textarea + 전송/중단 + limit 선택, limit 은 `FlayStorage` 보존) |
| `src/view/page.flay-ai.html` / `.ts` / `.scss` | 엔트리 3종. `.ts` 는 `import './inc/Page'` + `<main>` 에 패널 append (기존 `page.flay-basket.ts` 패턴) |

### flay-web/frontend (수정 2건)

- `webpack.common.cjs` — `entryPoints.pages` 에 `'page.flay-ai': './src/view/page.flay-ai.ts'` 추가
- `src/nav/SideNavBar.ts` — 메뉴 `{ url: 'page.flay-ai.html', name: 'flay ai' }` 추가

## 데이터 흐름

```
[composer 전송]
  → POST ai.kamoru.jk:8000/api/chat (SSE, kind=instance)
  → tool_call   : 적용 조건 칩 표시 (tags / tag_any_groups / sort / limit …)
  → tool_result : hits 추출(list | {items}) → opus 중복 제거
                  → hit 마다 new FlayCard().set(opus)  ← 상세는 flay-web backend 가 로드
  → token/done  : "N건 · 조건" 요약 한 줄
  → error/중단  : 오류·중단 표시 (0건이면 안내 문구)
```

flay-ai 는 **opus 목록과 요약을 주는 검색 엔진**으로만 쓰고, 영상 상세·포스터·재생 연동은
전부 기존 flay-web 경로(FlayCard 내부)를 그대로 탄다. 두 시스템 간 결합은 opus 문자열 하나다.

## 구현 단계

```
1. flay-ai config.yaml CORS 추가 + 8000 재시작
   → 검증: flay.kamoru.jk 페이지 콘솔에서 fetch('https://ai.kamoru.jk:8000/healthz') 200,
            POST /api/chat preflight 통과
2. src/ai/flayAiChat.ts (클라이언트 + 타입)
   → 검증: yarn type-check
3. FlayAiChatPanel + 엔트리 3종 + webpack 등록 + SideNavBar 메뉴
   → 검증: yarn type-check, node madge.cjs(순환 의존성),
            frontend watch 재기동 후 https://flay.kamoru.jk/dist/page.flay-ai.html 브라우저 확인
4. E2E: 실제 질의("온천 아무거나 5개" 등) → FlayCard 5장 렌더, 중단 버튼, 0건 안내 확인
5. 문서 갱신: docs/flay-web/ 관련 문서(있는 것만), flay-web/frontend/CLAUDE.md 구조 표는 불변이라 무영향
```

## 리스크·주의

- **webpack 설정 변경은 watch 가 못 잡는다** — 엔트리 등록 후 인앱 frontend 백그라운드 작업을
  중지하고 `tail -f /dev/null | yarn dev` 로 재기동해야 한다. `yarn build` 를 watch 와 병행하지 말 것.
- flay-ai(8000) 미기동 시 페이지가 죽지 않도록 전송 시점 오류를 잡아 안내 문구로 표시한다.
- limit 상한은 flay-ai API 와 동일하게 1..100, 기본 10 — FlayCard 다수 동시 로드 부하 고려.
- archive 결과는 1차 미지원(kind=instance 고정). 확장 시 `FlayFetch.getArchive` 경로 추가.
