# flay-ai/packages/rag — 지침

`packages/rag/` = 검색기 + 랭커 + LLM 라우터. 채팅 한 줄이 답이 되기까지의 핵심.

## 구성

| 파일 | 책임 |
| --- | --- |
| `router.py` | Ollama tool calling 흐름. `SYSTEM_PROMPT`, 1차(tool 결정)→코드 필터 보강→도구 실행→코드 요약(2차 LLM 없음) |
| `tools.py` | LLM 이 호출하는 도구 5종 + `TOOL_SCHEMA`(JSON Schema) + `TOOL_DISPATCH` |
| `retriever.py` | 하이브리드 검색: Qdrant semantic + SQLite FTS5 → RRF 결합 |
| `ranker.py` | 가중치 재정렬 (`config.yaml.ranking`) |

## 도구 5종 (read-only)

`search_videos` · `similar_to` · `get_video` · `get_actress` · `stats`.
모든 도구는 **read-only**(DB read + Qdrant search 만). write 는 별도 명시적 라우트.
새 도구 추가 시: `tools.py` 에 함수 + `TOOL_SCHEMA` 항목 + `TOOL_DISPATCH` 등록 3곳을 모두 갱신하고, `SYSTEM_PROMPT` 의 라우팅 규칙에 호출 조건을 명문화한다(절차: `.claude/skills/ai-add-rag-tool`).

## LLM (Ollama)

- 모델은 `config.yaml.models.llm`. 모델명을 하드코딩하지 말고 `_llm_model()` 사용(12GB VRAM 에선 7B 가 100% GPU 로 들어가 적합 — 14B/멀티모달은 오프로드·thinking 으로 부적합).
- **LLM 은 1차 "도구 라우팅"에만 쓴다.** 도구 결과를 자연어로 설명하는 2차 호출은 **하지 않는다** — 사용자 목적은 opus 결과(카드)이고, 코드(`_summarize_results`)가 "건수+적용 필터" 한 줄을 만든다.
- 과거의 한국어→중국어 드리프트 방어 로직(한자 컷, 3회 재시도, 한국어 강제 재주입, `_compact_tool_result`)은 **모두 제거됨**. 2차 LLM 답변을 다시 도입하지 않는 한 되살리지 말 것.
- `options`: `temperature=0.2`, `repeat_penalty=1.25` (1차 tool_call 안정용).

## 라우팅 방어 (router.py)

- tool 미호출 시 `search_videos(query=user_query)` 강제 폴백(빈손 응답 금지).
- 질문에 품번 패턴(`[A-Za-z]{2,7}-?\d{2,5}`)이 없으면 `get_video`/`similar_to` 호출을 `search_videos` 로 교체.
- `_extract_meta()` 로 year/month/min_rank/rank/min_likes/min_play/max_play/sort/kind/playable 를 정규식 추출해 `search_videos` args 에 주입(LLM 누락 방어). 평점 "N 이상"→`min_rank`, "랭크 N"/"별점 N"→`rank`, "좋아요/하트/찜 N"→`min_likes`, "재생 N 이상/이하"→`min_play`/`max_play`, "최근/마지막에 본"→`sort=recent`, "오래 안 본"→`sort=oldest`, **"아무거나/랜덤/무작위/임의로/되는대로"→`sort=random`**(recent/oldest 보다 우선). studio/actress 는 query 로 semantic+FTS 매칭.
- **무작위 모드**(`sort=random`): 문장을 그대로 검색어로 쓰면 의미검색 잡음(예: '10' 이 든 제목)이 후보를 정하므로, `_strip_for_random()` 이 무작위어·개수·요청 동사(추천해줘/골라줘…)·메타 표현·불용어·홀로 남은 조사를 걷어낸 **핵심어만** `query` 로 남긴다(없으면 `""`). `search_videos` 는 query 가 있으면 관련도 top-K(≥50) 안에서 `random.sample`, 없으면 SQL `ORDER BY RANDOM()`(kind·연도·태그 등 필터 유지).
- **개수**: `_extract_count()` 가 "N개/N편/N건/N작품"(1..100, 평점 표현 '별점 4개' 제외)을 잡으면 그 N 이 UI limit 보다 우선한다.
- **LLM 환각 인자 폐기**: LLM 이 넘긴 `year/month` 가 `_extract_meta` 로 질문에서 검출되지 않으면 버린다(7B 모델이 모호한 질의에서 `year=2023` 을 지어내는 사례 방어). studio/actress 는 검증하지 않는다.
- `_extract_tags()` 로 DB `tags.name`(2자+, 10분 캐시 `_known_tags`)이 질문에 그대로 포함되면 겹치지 않는 모든 매칭을 **최장 우선·최대 4개**까지 `tags` 로 주입. 복수 태그는 **AND**. 한국어 어미·조사 변형은 부분문자열로 못 잡음 → 의미검색 의존.
- `_extract_count_tags()` 로 남녀 명수 표현을 **카운트 태그**(`M:N` = 앞 남자수·뒤 여자수, 값 1/2/n)로 환산해 `tag_any`(OR 한 그룹)로 주입. 태그 필터는 `Filters.tag_groups`(그룹 내부 OR·그룹 간 AND): Qdrant 는 그룹마다 `should` 중첩, SQLite 는 그룹마다 `tag_id IN (...)` EXISTS.
- 결과 요약은 `_summarize_results()` 가 "건수+필터" 한 줄을 만들어 `token` 이벤트로 한 번 push.

## 검색 / 랭킹

- 하이브리드: `semantic_search`(Qdrant `videos`, BGE-M3) + `fts_search`(SQLite FTS5 trigram) → `rrf_merge`(RRF_K=60).
- FTS 쿼리는 `_fts_query()` 가 토큰을 `"phrase"` 로 감싸 `OR` 결합(CJK 안전).
- 가중치(`ranker.rank`): semantic 0.70 / fts 0.15 / usage 0.10 / recency 0.05 (half-life 180d). 값은 `config.yaml.ranking` 에서만 조정.
- query 가 비고 필터만 있으면 `_meta_only_search`(SQL 직접 정렬) 폴백.

## SSE 이벤트 계약 (프론트와 공유)

`tool_call {name,args}` → `tool_result {name,result}` → `token {text}` × N → `done {message,...}` / `error {message}`. 이벤트 타입 이름/구조를 바꾸면 `apps/web` 의 채팅 파서도 함께 수정해야 한다.
