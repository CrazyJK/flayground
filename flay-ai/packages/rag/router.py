"""LLM 기반 라우터 (Ollama tool calling).

AI_PLAN.md §7.1.
- 1차: Ollama /api/chat with tools=TOOL_SCHEMA
- 폴백: tool 호출 안 했으면 search_videos(query=...) 직접 호출
- 결과를 LLM 에 다시 넣어 자연어 응답 생성 (스트리밍)

사용:
    async for chunk in route_chat(messages):
        yield chunk
"""

from __future__ import annotations

import json
import logging
import re
import time
from collections.abc import AsyncIterator
from typing import Any

import httpx

from packages.indexer.db import connect
from packages.rag.tools import TOOL_DISPATCH, TOOL_SCHEMA
from packages.settings import load_config

log = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "당신은 사용자의 비디오 컬렉션 검색을 돕는 한국어 전용 비서입니다. "
    "제공된 도구(search_videos, similar_to, get_video, get_actress, stats)를 "
    "적극 사용하세요.\n"
    "\n"
    "[행동 규칙 — 반드시 준수]\n"
    "- 사용자에게 되묻지 마세요. '어떤 걸 추천해드릴까요?', '구체적으로 알려주세요' "
    "같은 반문 금지. 모호하더라도 일단 search_videos 를 호출해 결과를 보여주세요.\n"
    "- 빈손으로 응답하지 마세요. 자연어 질문이면 무조건 search_videos 먼저 호출.\n"
    "\n"
    "[도구 선택 규칙 — 반드시 준수]\n"
    "- 질문에 품번(예: SSSS-123, ABC-456 같은 영문+숫자 코드)이 **명시되어 있을 때만** "
    "get_video / similar_to 를 호출. 품번이 없으면 절대 호출 금지.\n"
    "- 그 외 모든 자연어 검색('회사 배경', '2023년 7월 발매작', 'S1 평점 4 이상', "
    "'지금 볼 수 있는 ...', '배우 이름 출연작' 등)은 **반드시 search_videos**.\n"
    "- 배우 이름이 들어가면 search_videos(actress=...) (별칭 자동 정규화). "
    "**단 actress 는 명백한 사람(배우) 이름일 때만.** '며느리·간호사·교복·여행·역NTR' 같은 "
    "일반 명사·테마·상황·장르 단어는 actress 가 아니라 반드시 **query** 에 넣는다.\n"
    "- **검색의 핵심 명사·키워드는 반드시 query 에 포함**시킨다. query 를 비운 채 메타 필터만 "
    "보내지 말 것(예: '평점 5에서 며느리 찾아' → query='며느리', rank=5).\n"
    "- **사용자가 쓴 한국어 단어를 로마자/영어로 바꾸지 말 것.** query·actress·studio 인자에는 "
    "사용자 표기를 그대로 넣는다(예: '며느리'를 'menuri'·'ménnérsi' 로 음역 금지).\n"
    "- 연도/월/제작사가 명시되면 search_videos(year=, month=, studio=) 메타 필터.\n"
    "- '지금 볼 수 있는' / '재생 가능한' → search_videos(kind='instance', playable=true).\n"
    "- '옛날 / 예전에 갖고 있던' → search_videos(kind='archive').\n"
    "- '아무거나 / 랜덤 / 무작위로 N개' 처럼 조건 없이 고르라는 요청 → "
    "search_videos(query='', sort='random', limit=N). 검색어·연도·제작사를 지어내지 말 것.\n"
    "- 통계/집계 질문은 stats.\n"
    "\n"
    "[출력 언어 — 절대 규칙]\n"
    "- 최종 답변은 **오직 한국어(한글)** 로만 작성. "
    "중국어(简体/繁体 한자), 일본어(ひらがな/カタカナ/漢字), 영어 문장 사용 절대 금지.\n"
    "- 한자어를 쓰지 말고 순 한글로: '추천작' (O), '推荐作' (X). '연도' (O), '年' (X).\n"
    "- 제목·배우명·스튜디오명 등 고유명사는 원문(영문/일문)을 그대로 인용 가능.\n"
    "- 날짜 표기는 'YYYY-MM' 또는 'YYYY년 M월' 형식.\n"
    "- 답변이 중국어로 흘러가려 하면 즉시 멈추고 한국어로 다시 쓰세요.\n"
    "\n"
    "도구 결과를 받으면, opus·제목·제작사·배우를 한 줄씩 나열하지 말고(카드에 이미 보임), "
    "뽑힌 영상들의 공통 소재·분위기와 질문에 왜 맞는지를 2~3문장으로 짧게 한국어로만 설명. "
    "한자(중국어)·일본어 가나·영어 문장 절대 금지 — 한자가 떠오르면 한글로 바꿔 쓴다."
)


def _ollama_url(path: str) -> str:
    cfg = load_config()
    return cfg["server"]["ollama"].rstrip("/") + path


def _llm_model() -> str:
    return load_config()["models"]["llm"]


_YEAR_RE = re.compile(r"(19|20)(\d{2})\s*년")
_MONTH_RE = re.compile(r"(?<!\d)([1-9]|1[0-2])\s*월")
_YEAR_ONLY_RE = re.compile(r"(?<!\d)(19|20)(\d{2})(?!\d)")
# "평점/별점/랭크 4 이상" → 최소 평점(min_rank, rank >= N)
_RANK_MIN_RE = re.compile(r"(?:평점|별점|랭크|등급)\D{0,4}([1-5])\s*(?:점|개|성|등급)?\s*이상")
# "평점/별점/랭크 5"(이상/이하 수식 없이) → 정확히 그 평점(rank == N). '랭크 5이고'·'별점 5' 등.
_RANK_EXACT_RE = re.compile(r"(?:평점|별점|랭크|등급)\D{0,4}([1-5])(?!\s*(?:이상|이하|미만|초과|\d))")
# "좋아요/하트/찜 N(개) 이상" → 최소 좋아요(min_likes, like_count >= N). '이상' 없는 '좋아요 N'도 최소로.
_LIKES_RE = re.compile(r"(?:좋아요|하트|찜)\D{0,4}(\d{1,4})")
# "지금 볼 수 있는"(instance) / "예전·보관"(archive) 키워드
_INSTANCE_RE = re.compile(r"지금|바로|당장|볼\s*수\s*있는|재생\s*가능|플레이\s*가능")
_ARCHIVE_RE = re.compile(r"예전|옛날|아카이브|보관|지난날")
# 재생 횟수(play): "재생(횟수) N 이상/이하", "N번 이상/이하 본"
_PLAY_MIN_RE = re.compile(r"(?:재생|플레이|시청)\D{0,5}(\d{1,4})\s*(?:회|번)?\s*이상")
_PLAY_MIN_BON_RE = re.compile(r"(\d{1,4})\s*번\s*이상\s*본")
_PLAY_MAX_RE = re.compile(r"(?:재생|플레이|시청)\D{0,5}(\d{1,4})\s*(?:회|번)?\s*이하")
_PLAY_MAX_BON_RE = re.compile(r"(\d{1,4})\s*번\s*이하\s*본")
# 마지막 재생(last_play) 정렬: 최근 본 → recent, 오래 안 본 → oldest
_SORT_RECENT_RE = re.compile(r"(?:최근|마지막|방금|요즘|얼마\s*전).{0,4}(?:본|봤|재생)")
_SORT_OLDEST_RE = re.compile(r"오래.{0,4}안.{0,3}(?:본|봤)|오랫동안.{0,4}안.{0,3}(?:본|봤)|본\s*지.{0,3}오래")
# 무작위 의도: "아무거나 / 아무 것이나 / 랜덤 / 무작위 / 임의로 / 되는대로 / 닥치는대로" → sort=random.
# 이런 질의는 문장 자체를 검색어로 쓰면 의미검색이 잡음(예: '10' 이 든 제목)을 끌어오므로
# 검색어를 비우고(핵심어만 남기고) 필터 범위 안에서 진짜 무작위로 뽑는다.
_RANDOM_RE = re.compile(
    r"아무\s*(?:거나|것이나|것|영상이나|작품이나|거라도|것이라도)"
    r"|(?:랜덤|무작위)(?:으로|로|하게|한|의|이나|)|임의(?:로|의|대로)?"
    r"|되는\s*대로|닥치는\s*대로"
)
# 결과 개수: "10개만 / 5편 / 3건 / 20작품" → limit. 평점·별점 표현("별점 4개 이상")과 구분하려고
# _extract_count 에서 평점 표현을 먼저 지운 뒤 매칭한다.
_COUNT_RE = re.compile(r"(?<!\d)(\d{1,3})\s*(?:개|편|건|작품)")
_RANK_PHRASE_RE = re.compile(r"(?:평점|별점|랭크|등급)\D{0,4}[1-5]\s*(?:점|개|성|등급)?")
# 무작위 모드에서 검색어로 남길 가치가 없는 요청 동사·불용어(핵심 명사만 남기기 위해 제거)
_FILLER_RE = re.compile(
    r"추천\s*(?:해\s*줘|해\s*주세요|해|좀|해봐|부탁)?|골라\s*(?:줘|주세요|봐)?|뽑아\s*(?:줘|주세요|봐)?"
    r"|보여\s*(?:줘|주세요)?|알려\s*(?:줘|주세요)?|찾아\s*(?:줘|주세요|봐)?|틀어\s*(?:줘|주세요)?"
    r"|주세요|줘|좀|볼\s*만\s*한|볼만한|보고\s*싶(?:은|어|다)?"
)
_STOPWORDS = {
    "작품", "영상", "비디오", "동영상", "것", "거", "것들", "거들", "중", "중에", "중에서", "에서",
    "하나", "한", "개", "건", "편", "만", "만한", "그냥", "대충", "적당히", "알아서", "아무", "이나",
    "지금", "볼", "수", "있는", "재생", "가능한", "예전", "옛날", "보관", "아카이브",
    # 홀로 남은 조사
    "으로", "로", "에", "의", "을", "를", "이", "가", "은", "는", "도", "와", "과", "랑", "하고",
}


def _extract_count(query: str) -> int | None:
    """'N개/N편/N건/N작품' → 결과 개수 N(1..100). 평점 표현('별점 4개 이상')의 숫자는 제외."""
    m = _COUNT_RE.search(_RANK_PHRASE_RE.sub(" ", query or ""))
    if not m:
        return None
    return max(1, min(100, int(m.group(1))))


def _strip_for_random(query: str) -> str:
    """무작위 모드용 핵심어 추출: 무작위어·개수·요청 동사·메타 표현(연도/월/평점/좋아요/재생/kind)·
    불용어를 걷어내고 남는 명사(테마·배우·제작사 등)만 돌려준다. 남는 게 없으면 ''(순수 무작위).
    """
    s = query or ""
    for rx in (
        _RANDOM_RE, _COUNT_RE, _RANK_PHRASE_RE, _FILLER_RE, _YEAR_RE, _MONTH_RE, _YEAR_ONLY_RE,
        _LIKES_RE, _PLAY_MIN_RE, _PLAY_MIN_BON_RE, _PLAY_MAX_RE, _PLAY_MAX_BON_RE,
        _SORT_RECENT_RE, _SORT_OLDEST_RE, _INSTANCE_RE, _ARCHIVE_RE,
    ):
        s = rx.sub(" ", s)
    toks = [t for t in re.split(r"[\s,.!?~·、。]+", s) if t and t not in _STOPWORDS]
    core = " ".join(toks).strip()
    return core if len(core) >= 2 else ""


def _extract_meta(query: str) -> dict:
    """질문에서 메타 필터(year/month/min_rank/rank/min_likes/min_play/max_play/sort/kind/playable) 추출.

    LLM 이 인자를 빠뜨리거나 tool_call 자체를 안 하는 경우(폴백)에 대비한 코드 레벨
    방어 장치. 이 값을 search_videos 인자에 주입해 LLM 품질과 무관하게 결과를 정확히 만든다.
    sort 는 무작위(random) > 최근 본(recent) > 오래 안 본(oldest) 순으로 우선한다.
    """
    out: dict = {}
    m = _YEAR_RE.search(query)
    if m:
        out["year"] = int(m.group(1) + m.group(2))
    else:
        m = _YEAR_ONLY_RE.search(query)
        if m:
            out["year"] = int(m.group(1) + m.group(2))
    mm = _MONTH_RE.search(query)
    if mm:
        out["month"] = int(mm.group(1))
    mr = _RANK_MIN_RE.search(query)
    if mr:
        out["min_rank"] = int(mr.group(1))
    else:
        me = _RANK_EXACT_RE.search(query)
        if me:
            out["rank"] = int(me.group(1))
    ml = _LIKES_RE.search(query)
    if ml:
        out["min_likes"] = int(ml.group(1))
    pm = _PLAY_MIN_RE.search(query) or _PLAY_MIN_BON_RE.search(query)
    if pm:
        out["min_play"] = int(pm.group(1))
    px = _PLAY_MAX_RE.search(query) or _PLAY_MAX_BON_RE.search(query)
    if px:
        out["max_play"] = int(px.group(1))
    if _RANDOM_RE.search(query):
        out["sort"] = "random"
    elif _SORT_RECENT_RE.search(query):
        out["sort"] = "recent"
    elif _SORT_OLDEST_RE.search(query):
        out["sort"] = "oldest"
    if _INSTANCE_RE.search(query):
        out["kind"] = "instance"
        out["playable"] = True
    elif _ARCHIVE_RE.search(query):
        out["kind"] = "archive"
    return out


# --- 태그명 사전 매칭 -------------------------------------------------
# DB tags.name 을 캐시해 질문에 등장하면 tag 필터로 주입(테마 질의 정확도↑).
_TAG_CACHE: list[str] = []
_TAG_CACHE_TS: float = 0.0
_TAG_TTL = 600.0  # 10분. 재인덱싱으로 태그가 늘어도 10분 내 자동 반영(또는 API 재시작).


def _known_tags() -> list[str]:
    """DB tags.name 을 길이 내림차순으로 캐시(최장 매칭 우선). 2자 이상만."""
    global _TAG_CACHE, _TAG_CACHE_TS
    now = time.monotonic()
    if _TAG_CACHE and (now - _TAG_CACHE_TS) <= _TAG_TTL:
        return _TAG_CACHE
    try:
        conn = connect()
        try:
            rows = conn.execute("SELECT name FROM tags").fetchall()
        finally:
            conn.close()
        _TAG_CACHE = sorted(
            {r["name"].strip() for r in rows if r["name"] and len(r["name"].strip()) >= 2},
            key=len,
            reverse=True,
        )
        _TAG_CACHE_TS = now
    except Exception as e:
        log.warning("known tags 로드 실패: %s", e)
    return _TAG_CACHE


def _extract_tags(query: str, max_tags: int = 4) -> list[str]:
    """질문에 DB 태그명이 그대로 포함되면 (겹치지 않는) 모든 매칭을 최장 우선으로 반환.

    테마 명사(온천·며느리·간호사 등)는 보통 원형 그대로 등장하므로 부분문자열 매칭이
    실용적. 최장 매칭 우선 + 이미 매칭된 글자 구간은 재사용하지 않아 '온천' 매칭 시
    부분 태그('천')가 중복 추가되는 것을 막는다. 복수 태그는 search_videos 에서 AND
    (모두 포함하는 영상만)로 적용. max_tags 로 과도한 필터링 방지.
    """
    q = query or ""
    if not q:
        return []
    claimed = [False] * len(q)
    out: list[str] = []
    for name in _known_tags():  # 길이 내림차순
        start = 0
        while True:
            idx = q.find(name, start)
            if idx < 0:
                break
            if not any(claimed[idx : idx + len(name)]):
                for i in range(idx, idx + len(name)):
                    claimed[i] = True
                out.append(name)
                break
            start = idx + 1
        if len(out) >= max_tags:
            break
    return out


# --- 남녀 명수 → 카운트 태그(앞=남자 수, 뒤=여자 수) ----------------
# DB 카운트 태그 예: 2:1, n:1, 1:2, 2:2, 1:n, n:n. 값은 1 / 2 / n(여러).
_COUNT_TAG_RE = re.compile(r"^([0-9n]+):([0-9n]+)$", re.IGNORECASE)
_NUM_WORDS = {
    "한": 1, "하나": 1, "두": 2, "둘": 2, "세": 3, "셋": 3, "석": 3,
    "네": 4, "넷": 4, "다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8, "아홉": 9, "열": 10,
}
_NUM_ALT = "|".join(sorted(_NUM_WORDS, key=len, reverse=True))  # 긴 한글 수사 우선


def _known_count_tags() -> list[tuple[str, str, str]]:
    """DB 태그 중 'M:W' 형식만 (name, men, women). men/women ∈ {'1','2','n',...}."""
    out: list[tuple[str, str, str]] = []
    for name in _known_tags():
        m = _COUNT_TAG_RE.match(name.strip())
        if m:
            out.append((name, m.group(1).lower(), m.group(2).lower()))
    return out


def _count_value(query: str, gender: str) -> str | None:
    """질문에서 해당 성별(gender 정규식)의 명수를 '1'/'2'/'n'(여러) 로 추출. 없으면 None."""
    # '여러/여럿/다수 [명(의)] <성별>' (예: '여러 남자', '여러 명의 여자')
    if re.search(rf"(?:여러|여럿|다수)\s*(?:명\s*의?\s*)?(?:{gender})", query):
        return "n"
    # '<성별>[들/이/가/는] 여러/여럿' (예: '남자 여럿', '남자들 여러 명')
    if re.search(rf"(?:{gender})\s*(?:들|이|가|는)?\s*(?:여러|여럿)", query):
        return "n"
    # '<성별> N명' 또는 'N명(의) <성별>'
    m = re.search(rf"(?:{gender})\D{{0,3}}({_NUM_ALT}|\d+)\s*명", query) or re.search(
        rf"({_NUM_ALT}|\d+)\s*명\s*의?\s*(?:{gender})", query
    )
    if m:
        tok = m.group(1)
        n = int(tok) if tok.isdigit() else _NUM_WORDS.get(tok, 0)
        if n >= 3:
            return "n"
        if n in (1, 2):
            return str(n)
    return None


def _extract_count_tags(query: str) -> list[str]:
    """남자/여자 명수 표현 → 해당 DB 카운트 태그 후보(OR 그룹).

    한쪽만 지정되면 그 차원에 맞는 태그를 모두(OR), 양쪽 지정되면 정확 조합으로 좁힘.
    예: '여러 남자' → 남=n → [n:1, n:n].  '남자 1명 여자 여러명' → 남=1·여=n → [1:n].
    search_videos 에서 tag_any(OR 한 그룹)로 적용 → 다른 테마 태그(AND)와 결합.
    """
    q = query or ""
    men = _count_value(q, "남자|남성")
    women = _count_value(q, "여자|여성")
    if men is None and women is None:
        return []
    out: list[str] = []
    for name, mv, wv in _known_count_tags():
        if men is not None and mv != men:
            continue
        if women is not None and wv != women:
            continue
        out.append(name)
    return out


# 적용된 검색 필터를 한국어 한 줄로 (LLM 묘사 대체용)
_KIND_LABEL = {"instance": "지금 볼 수 있는 것", "archive": "보관 영상"}


def _summarize_results(tool_calls: list[dict], results: list[dict]) -> str:
    """opus 결과(카드)가 목적이므로 LLM 묘사 대신 코드로 '건수 + 적용 필터'만 요약."""
    total = sum(len(r["result"]) for r in results if isinstance(r.get("result"), list))
    parts: list[str] = []
    for c in tool_calls:
        fn = c.get("function") or {}
        if fn.get("name") != "search_videos":
            continue
        a = fn.get("arguments") or {}
        if isinstance(a, str):
            try:
                a = json.loads(a)
            except json.JSONDecodeError:
                a = {}
        if a.get("year"):
            parts.append(f"{a['year']}년")
        if a.get("month"):
            parts.append(f"{int(a['month'])}월")
        if a.get("studio"):
            parts.append(str(a["studio"]))
        if a.get("actress"):
            parts.append(str(a["actress"]))
        if a.get("tag"):
            parts.append(f"#{a['tag']}")
        if a.get("tags"):
            parts.extend(f"#{t}" for t in a["tags"])
        if a.get("tag_any"):
            parts.append("#" + "|".join(str(t) for t in a["tag_any"]))
        if a.get("min_rank"):
            parts.append(f"평점 {a['min_rank']}+")
        if a.get("rank"):
            parts.append(f"평점 {a['rank']}")
        if a.get("min_likes"):
            parts.append(f"좋아요 {a['min_likes']}+")
        if a.get("min_play") is not None:
            parts.append(f"재생 {a['min_play']}+")
        if a.get("max_play") is not None:
            parts.append(f"재생 {a['max_play']}-")
        if a.get("sort") == "recent":
            parts.append("최근 본 순")
        elif a.get("sort") == "oldest":
            parts.append("오래된 순")
        elif a.get("sort") == "random":
            parts.append("무작위")
        if a.get("kind") in _KIND_LABEL:
            parts.append(_KIND_LABEL[a["kind"]])
        elif a.get("playable"):
            parts.append(_KIND_LABEL["instance"])
        break
    parts = list(dict.fromkeys(parts))  # 중복 제거(순서 보존)
    cond = f" · 조건: {' · '.join(parts)}" if parts else ""
    if total <= 0:
        return f"조건에 맞는 결과가 없어요.{cond}"
    return f"{total}건을 찾았어요.{cond}"


def _exec_tool(name: str, args: dict) -> Any:
    fn = TOOL_DISPATCH.get(name)
    if fn is None:
        return {"error": f"unknown tool: {name}"}
    try:
        return fn(**(args or {}))
    except TypeError as e:
        return {"error": f"bad args: {e}"}
    except Exception as e:
        log.exception("tool %s failed", name)
        return {"error": str(e)}


async def _call_chat(
    client: httpx.AsyncClient, messages: list[dict], tools: list[dict] | None, stream: bool
) -> dict | AsyncIterator[dict]:
    payload = {
        "model": _llm_model(),
        "messages": messages,
        "stream": stream,
        "options": {
            "temperature": 0.2,
            # Qwen 7B 가 도구 결과 요약 중 쉼표/줄바꿈 반복 루프에 빠지는 것 방지
            "repeat_penalty": 1.25,
            "repeat_last_n": 128,
            # 최대 출력 토큰 상한 (대략 항목 20개 요약 분량)
            "num_predict": 1024,
        },
    }
    if tools:
        payload["tools"] = tools

    if not stream:
        r = await client.post(_ollama_url("/api/chat"), json=payload, timeout=120.0)
        r.raise_for_status()
        return r.json()

    async def gen():
        async with client.stream(
            "POST", _ollama_url("/api/chat"), json=payload, timeout=None
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue

    return gen()


async def route_chat(
    user_query: str,
    history: list[dict] | None = None,
    limit: int = 10,
    kind: str | None = None,
) -> AsyncIterator[dict]:
    """async generator. event dict 시리즈를 yield.

    이벤트 타입:
        {"type": "tool_call",   "name": str, "args": dict}
        {"type": "tool_result", "name": str, "result": Any}
        {"type": "token",       "text": str}
        {"type": "done",        "message": str, "tool_calls": list, "results": list}
    """
    history = history or []
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *history,
        {"role": "user", "content": user_query},
    ]

    async with httpx.AsyncClient() as client:
        # 1차: tool 결정
        first = await _call_chat(client, messages, tools=TOOL_SCHEMA, stream=False)
        msg = first.get("message", {}) or {}
        tool_calls = msg.get("tool_calls") or []

        # Ollama 가 tool 호출 안 했으면 무조건 폴백 (LLM이 사용자에게 되묻기 시도해도 차단)
        # content 가 있더라도 도구 결과 없이 끝나면 빈손이므로 search_videos 강제
        if not tool_calls:
            log.info(
                "router fallback: no tool_calls, forcing search_videos (raw content=%r)",
                (msg.get("content") or "")[:80],
            )
            tool_calls = [
                {
                    "function": {
                        "name": "search_videos",
                        "arguments": {"query": user_query, "limit": limit},
                    }
                }
            ]

        # 방어: 사용자 질문에 품번 패턴이 없는데 get_video/similar_to 호출 시
        # search_videos 로 강제 교체 (시스템 프롬프트를 무시한 LLM 오라우팅 방지)
        has_opus_in_query = bool(re.search(r"[A-Za-z]{2,7}-?\d{2,5}", user_query))
        if not has_opus_in_query:
            fixed: list[dict] = []
            for c in tool_calls:
                nm = (c.get("function") or {}).get("name") or ""
                if nm in ("get_video", "similar_to"):
                    log.info("router override: %s -> search_videos (no opus in query)", nm)
                    fixed.append(
                        {
                            "function": {
                                "name": "search_videos",
                                "arguments": {"query": user_query, "limit": limit},
                            }
                        }
                    )
                else:
                    fixed.append(c)
            # 중복 search_videos 제거 (같은 query)
            seen = set()
            dedup: list[dict] = []
            for c in fixed:
                fn = c.get("function") or {}
                key = (fn.get("name"), json.dumps(fn.get("arguments"), sort_keys=True, default=str))
                if key in seen:
                    continue
                seen.add(key)
                dedup.append(c)
            tool_calls = dedup

        # 메타 필터 보강: 질문에서 year/month 가 명확히 추출되면 search_videos args 에 강제 주입
        # (LLM 이 메타 인자를 빠뜨리거나 query 만 보내는 경우 방어)
        meta = _extract_meta(user_query)
        # 태그명 사전 매칭: 질문에 DB 태그명이 그대로 있으면 (복수) tags 필터로 주입(테마 질의 정확도↑).
        tags = _extract_tags(user_query)
        if tags:
            meta.setdefault("tags", tags)
        # 남녀 명수(예: '여러 남자', '여자 2명') → 카운트 태그 OR 그룹으로 주입
        count_tags = _extract_count_tags(user_query)
        if count_tags:
            meta.setdefault("tag_any", count_tags)
        is_random = meta.get("sort") == "random"
        for c in tool_calls:
            fn = c.get("function") or {}
            if fn.get("name") != "search_videos":
                continue
            args = fn.get("arguments") or {}
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError:
                    args = {}
            # LLM 이 지어낸 연도/월 폐기: 질문 원문에 그 표현이 없으면(정규식 미검출) 근거 없는 인자.
            # (모호한 질의에서 7B 모델이 year=2023 등을 환각하는 사례 방어)
            for k in ("year", "month"):
                if args.get(k) and k not in meta:
                    log.info("router drop hallucinated %s=%r (not in query)", k, args[k])
                    args.pop(k, None)
            # 메타/태그 보강: LLM 이 빠뜨린 인자만 채운다.
            changed = False
            for k, v in meta.items():
                if not args.get(k):
                    args[k] = v
                    changed = True
            if changed:
                log.info("router meta boost: search_videos args <- %s", meta)
            # 무작위 모드: 문장 전체를 검색어로 쓰면 의미검색 잡음이 후보를 정하므로,
            # 무작위어·개수·요청 동사·메타 표현을 걷어낸 핵심어만 남긴다(없으면 '' → 순수 무작위).
            if is_random:
                args["query"] = _strip_for_random(user_query)
                args["sort"] = "random"
                log.info("router random mode: query=%r", args["query"])
            fn["arguments"] = args
            c["function"] = fn

        # limit: 질문에 '10개만' 처럼 개수가 명시되면 그것을, 아니면 프론트 설정값을 강제 주입
        # (LLM 기본값 무시). kind 가 instance/archive 면 UI 에서 명시적으로 고른 것이므로 강제 주입.
        eff_limit = _extract_count(user_query) or limit
        for c in tool_calls:
            fn = c.get("function") or {}
            if fn.get("name") != "search_videos":
                continue
            args = fn.get("arguments") or {}
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError:
                    args = {}
            args["limit"] = eff_limit
            if kind in ("instance", "archive"):
                args["kind"] = kind
            fn["arguments"] = args
            c["function"] = fn

        results_for_history: list[dict] = []
        for call in tool_calls:
            fn = call.get("function") or {}
            name = fn.get("name") or ""
            raw_args = fn.get("arguments") or {}
            if isinstance(raw_args, str):
                try:
                    raw_args = json.loads(raw_args)
                except json.JSONDecodeError:
                    raw_args = {}
            yield {"type": "tool_call", "name": name, "args": raw_args}
            result = _exec_tool(name, raw_args)
            yield {"type": "tool_result", "name": name, "result": result}
            results_for_history.append({"name": name, "args": raw_args, "result": result})

        # 설명문(LLM 2차 생성) 생략 — 사용자 목적은 opus 결과(카드)이고 묘사 문장은 불필요.
        # 코드로 '건수 + 적용 필터' 한 줄만 만들어 중국어 드리프트·재시도·2차 LLM 호출을 모두 제거.
        summary = _summarize_results(tool_calls, results_for_history)
        yield {"type": "token", "text": summary}
        yield {
            "type": "done",
            "message": summary,
            "tool_calls": [{"name": r["name"], "args": r["args"]} for r in results_for_history],
        }
