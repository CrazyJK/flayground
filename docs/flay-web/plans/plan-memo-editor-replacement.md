# 메모 에디터 교체 계획 — Toast UI Editor → contenteditable 자체 구현

`flay-web/frontend` 의 `FlayMemoEditor`(사이드 내비 "memo" 모달)가 쓰는 WYSIWYG 에디터를 Toast UI Editor 에서 **라이브러리 없는 contenteditable 구현**으로 교체한다.

> 상태: **완료**(2026-08-17). 구현은 `src/editor/HtmlEditor.ts`(외부 의존성 0). 실측(프로덕션): 메모 청크 JS 589KB→32KB(dev 기준 미압축, 프로덕션 수 KB), CSS 182KB→7KB, `dist` 전체 gzip 649KB→약 490KB. 결정 경위: 3안 비교에서 TipTap 을 채택해 구현했으나 메모 용도엔 ProseMirror 코어(약 390KB)가 과해 **contenteditable + execCommand 로 다시 단순화**했다. 추가로 `FlayMemoEditor.save()` 가 `FormData` 를 JSON 전송 API 에 넘겨 빈 본문이 저장되던 버그(2호)도 함께 수정.

## 1. 현황

| 항목 | 내용 |
| --- | --- |
| 사용처 | `src/flay/panel/FlayMemoEditor.ts` 한 곳(`SideNavBar` "memo" 메뉴 → `ModalWindow` 300×200, `view/test.ts` 의 테스트 버튼). `ToastHtmlViewer` 는 **어디서도 사용하지 않음**(데드 코드) |
| 래퍼 | `src/editor/ToastHtmlEditor.ts`(95줄) — `<toast-html-editor>` 커스텀 엘리먼트, API: `getEditorHTML()`·`setEditorHTML(html, append)`·`hide()`·`show()`, 이벤트 `editor-load`·`editor-blur`·`editor-change`(+ 생성자 콜백) |
| 사용 기능 | WYSIWYG 만(`hideModeSwitch`, 마크다운 모드 미사용), 글자색(`color-syntax` 플러그인), 다크 테마(`html[theme]` 속성 → Toast 테마), 자동 저장(blur), 로드 시 HTML 주입 |
| 데이터 | 백엔드 `GET/POST /api/v1/memos` → `K:/Crazy/Info/memo.html` 단일 HTML 파일(현재 328바이트, `<p><span style="color:…">` 만 사용) |
| 의존성 | `@toast-ui/editor ^3.2.1`(**최종 릴리스 2023-02, 사실상 유지보수 중단**), `@toast-ui/editor-plugin-color-syntax`, `tui-color-picker`(전이). 타입 선언이 없어 `@ts-ignore` 로 import |
| 번들 | 개발 빌드 `dist/vendor.toast-ui.js` 2.39MB + `dist/FlayMemoEditor.css` 763KB(에디터·다크 테마·컬러피커 CSS 전부 포함) — 300바이트 메모용으로 과도. webpack 은 `vendor.toast-ui` 를 별도 청크로 분리(dev/prod cacheGroups, HtmlWebpackPlugin chunks 목록) |
| 발견한 버그 | `FlayMemoEditor.save()` 가 `this.htmlEditor.getHTML()` 을 호출 — 래퍼 메서드는 `getEditorHTML()` 이고 `getHTML()` 은 DOM `Element.getHTML()`(엘리먼트 innerHTML 직렬화)로 해석되어 **에디터 UI 마크업 전체가 저장**될 수 있음. `memo.html.*` 백업 파일이 0개인 것으로 보아 최근 저장 경로가 실제로 동작하지 않았을 가능성이 큼 → 교체 시 함께 수정 |

## 2. 요구사항

- HTML 입출력(기존 `memo.html` 그대로 로드·저장, `<p>`·`<br>`·`<span style="color">` 보존)
- 글자색 지정, 굵게/기울임/취소선/링크/목록 정도의 최소 서식, 키보드 단축키
- 다크/라이트 테마: 프로젝트 CSS 변수(`--color-*`, `--font-family-monospace`)를 그대로 써서 `html[theme]` 에 자동 추종(별도 테마 CSS 없이)
- 프레임워크 없는 Web Component 안에서 동작, TypeScript 타입 제공(`@ts-ignore` 제거)
- 기존 래퍼 API·이벤트 이름 유지 → `FlayMemoEditor` 변경 최소
- 번들 대폭 축소, 활발히 유지보수되는 라이브러리

## 3. 후보 비교 (2026-08 npm 레지스트리 기준)

| 후보 | 최신 | 성격 | 평가 |
| --- | --- | --- | --- |
| **TipTap** (`@tiptap/core` 3.30.1, 2026-08) | 활발 | ProseMirror 기반 **헤드리스**. `getHTML()`/`setContent(html)` 네이티브, `TextStyle`+`Color` 확장으로 글자색, StarterKit(굵게·기울임·목록·링크·단축키). 툴바는 직접(작은 버튼 몇 개) | 1차 채택·구현했으나 메모 용도엔 ProseMirror 코어(약 390KB)가 과함 → 최종 제외 |
| Quill 2 (2.0.3, 2024-11) | 완만 | 툴바·컬러피커 내장(snow 테마). 내부 모델은 Delta, HTML 은 `getSemanticHTML()`/클립보드 변환 | 준비된 UI 가 장점이나 HTML 라운드트립이 간접적이고 테마 CSS(~30KB) 오버라이드 필요. 차선 |
| Lexical (0.49, 2026-07) | 활발 | Meta, React 중심 문서, 바닐라 사용은 저수준 | 작업량 큼 → 제외 |
| CKEditor 5 / TinyMCE | — | 무겁고 라이선스·브랜딩 | 제외 |
| Editor.js / Milkdown | — | 블록 JSON / 마크다운 중심 | HTML 저장 형식과 안 맞음 → 제외 |
| **contenteditable 자체 구현** | — | 브라우저 내장 편집 + `execCommand`(`foreColor`/`bold`/`createLink`/`removeFormat`, `styleWithCSS`), 붙여넣기 plain text | **최종 채택**. 메모는 URL 몇 줄 + 글자색이 전부라 충분. 의존성 0, ~130줄. `execCommand` 는 사양상 deprecated 이나 대체 API 가 없고 모든 브라우저가 지원 |

## 4. 설계

### 4.1 새 래퍼 `src/editor/HtmlEditor.ts` (`<html-editor>`)

- 의존성 없음. 툴바 `div` + `div[contenteditable]` 두 요소. `document.execCommand('styleWithCSS', true)`·`defaultParagraphSeparator=p` 로 `<span style="color">`·`<p>` 출력(저장 파일 형식과 일치).
- 공개 API 는 이전 래퍼와 동일: `getEditorHTML()` → `innerHTML`, `setEditorHTML(html, append=false)` → `innerHTML`/`insertAdjacentHTML`, `hide()`/`show()` 는 클래스 토글, 이벤트 `editor-load`(연결 완료)·`editor-change`(`input`)·`editor-blur`(`blur`) + 생성자 콜백 `{ load, blur, change }`.
- 툴바: 글자색 프리셋 6색 + `<input type=color>`, 굵게, 링크(prompt, 빈 값이면 해제), 서식 지우기(`removeFormat`). 버튼은 `mousedown` 기본 동작을 막아 선택 영역·포커스 유지.
- 붙여넣기는 `text/plain` 만 `insertText`(외부 서식 유입 차단).
- `HtmlEditor.scss`: 프로젝트 CSS 변수만 사용 → 테마 자동. `FlayMemoEditor.scss` 는 `.html-editor-content` 에 모노스페이스 폰트.

### 4.2 `FlayMemoEditor` 변경

- import 를 `@editor/HtmlEditor` 로, `save()` 의 `getHTML()` → `getEditorHTML()` (버그 수정).
- 그 외 로직(로드·blur 저장·제목 갱신·`onstorage` 동기화) 무변경.

### 4.3 정리

- 삭제: `src/editor/ToastHtmlEditor.{ts,scss}`, `src/editor/ToastHtmlViewer.{ts,scss}`(미사용).
- 의존성 제거: `@toast-ui/editor`, `@toast-ui/editor-plugin-color-syntax`(→ `tui-color-picker` 전이 제거).
- webpack: `webpack.dev.cjs`/`webpack.prod.cjs` 의 `vendor.toast-ui` 청크명(HtmlWebpackPlugin `chunks` 목록)과 cacheGroups 정규식의 `@toast-ui|tui-color-picker` 제거. 에디터 vendor 청크는 더 이상 없다.
- 문서: `docs/flay-web/references.md` 의 `yarn add @toast-ui/editor` 예시 → 일반 예시로, `.cspell` 의 `toastui` 제거, `.claude/skills/web-frontend-component` 에 에디터 언급 있으면 갱신.

## 5. 단계 → 검증

1. 의존성 교체(`yarn remove …`, `yarn add …`) → 검증: `yarn install` 후 `yarn type-check` 통과(Toast import 삭제 전이면 실패해야 정상 — 2단계와 함께).
2. `HtmlEditor.ts/.scss` 작성, `FlayMemoEditor` 연결(+`getHTML` 버그 수정) → 검증: `yarn type-check`·`yarn lint:check` 통과, 개발 watch 재빌드 성공.
3. 브라우저 확인(`https://flay.kamoru.jk/dist/index.html` → 사이드 내비 memo): 기존 `memo.html` 이 색상 그대로 로드 → 텍스트·색·링크 편집 → 모달 밖 클릭(blur) → 모달 제목이 "updated: … N characters" 로 갱신 → `K:/Crazy/Info/memo.html` 내용이 편집 결과의 **깨끗한 HTML** 이고 `memo.html.<timestamp>` 백업이 생겼는지 확인 → 라이트/다크 테마 전환 시 가독성 확인.
4. Toast 파일·설정·문서 정리 → 검증: 저장소 전역 `toast|tui-` grep 0건(과거 계획 문서 제외), 프로덕션 `yarn build`(watch 중지 후) 성공, `dist/vendor.toast-ui.js` 사라짐·`FlayMemoEditor.css` 수 KB 로 축소 — 전후 크기 기록.
5. 커밋(코드 1 커밋 + 정리 1 커밋으로 나눠도 됨).

## 6. 리스크·대응

- **HTML 왜곡**: ProseMirror 스키마 밖 마크업(임의 인라인 style, 표 등)은 로드 시 드롭된다. 현재 `memo.html` 은 `<p>`·`<br>`·색상 `<span>` 뿐이라 안전하지만, 3단계에서 **첫 저장 전에** `memo.html` 을 수동 백업하고 로드 결과 HTML 을 diff 로 비교한다.
- **`execCommand` deprecated**: 대체 표준 API 가 없고 브라우저 지원이 유지되므로 사용하되, 만약 제거되면 `Selection`/`Range` 로 span 을 직접 감싸는 구현으로 교체(색·굵게 두 가지뿐이라 소규모).
- **모달 크기**: 300×200 에서 툴바가 줄바꿈되면 아이콘만 표시·툴팁으로.
- **롤백**: 데이터 형식이 같은 HTML 이라 언제든 커밋 되돌리기로 복귀 가능.

## 7. 범위 밖(별도 검토)

- 메모 다중화·마크다운 지원·이미지 첨부 — 현재 요구 없음.
- 실시간 자동 저장(디바운스) — 지금은 blur 저장 유지.
