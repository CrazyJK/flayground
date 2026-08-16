"""rag/router 코드 레벨 보강(정규식 추출) 단위 테스트 — LLM/DB 없이 순수 함수만."""

from packages.rag.router import (
    _extract_count,
    _extract_meta,
    _strip_for_random,
    _summarize_results,
)
from packages.rag.tools import _apply_sort


def test_random_intent_sets_sort_random():
    for q in ("아무거나 10개만 추천해", "랜덤으로 5편", "무작위 추천", "아무 것이나 골라줘", "임의로 3개"):
        assert _extract_meta(q).get("sort") == "random", q


def test_random_wins_over_recent():
    assert _extract_meta("최근 본 것 중 아무거나")["sort"] == "random"


def test_non_random_queries_unaffected():
    assert "sort" not in _extract_meta("2023년 7월 S1 평점 4 이상")
    assert _extract_meta("최근에 본 거")["sort"] == "recent"


def test_extract_count():
    assert _extract_count("아무거나 10개만 추천해") == 10
    assert _extract_count("랜덤 5편") == 5
    assert _extract_count("3건만") == 3
    assert _extract_count("추천해줘") is None
    # 평점 표현의 숫자는 개수로 오해하지 않는다
    assert _extract_count("별점 4개 이상") is None
    assert _extract_count("평점 5개 짜리 아무거나 7개") == 7
    # 상한 100
    assert _extract_count("999개") == 100


def test_strip_for_random_leaves_only_core_terms():
    assert _strip_for_random("아무거나 10개만 추천해") == ""
    assert _strip_for_random("랜덤으로 5편 골라줘") == ""
    assert _strip_for_random("2023년 작품 중에서 아무거나") == ""
    assert _strip_for_random("지금 볼 수 있는 것 중 무작위 3개") == ""
    # 테마·배우 같은 핵심 명사는 남는다
    assert _strip_for_random("온천 나오는 거 아무거나 5개") == "온천 나오는"
    assert _strip_for_random("아무거나 며느리") == "며느리"


def test_summarize_random_label():
    calls = [{"function": {"name": "search_videos", "arguments": {"query": "", "sort": "random", "limit": 10}}}]
    results = [{"name": "search_videos", "args": {}, "result": [{"opus": "A"}] * 10}]
    assert _summarize_results(calls, results) == "10건을 찾았어요. · 조건: 무작위"


def test_apply_sort_random_is_permutation():
    hits = [{"opus": str(i)} for i in range(20)]
    out = _apply_sort(hits, "random")
    assert len(out) == 20
    assert sorted(h["opus"] for h in out) == sorted(h["opus"] for h in hits)
