"""rag/router 코드 레벨 보강(정규식 추출) 단위 테스트 — LLM/DB 없이 순수 함수만."""

import packages.rag.router as router
from packages.rag.router import (
    _core_terms,
    _extract_count,
    _extract_meta,
    _extract_tags,
    _summarize_results,
)
from packages.rag.tools import _apply_sort


def test_random_intent_sets_sort_random():
    for q in ("아무거나 10개만 추천해", "랜덤으로 5편", "무작위 추천", "아무 것이나 골라줘", "임의로 3개"):
        assert _extract_meta(q).get("sort") == "random", q


def test_popular_intent_sets_sort_popular():
    for q in ("가장 인기 있는 10개 보여줘", "인기순으로 5개", "많이 본 영상", "베스트 20개", "TOP 10",
              "좋아요 많은 것", "평점 높은 순으로"):
        assert _extract_meta(q).get("sort") == "popular", q


def test_sort_precedence():
    assert _extract_meta("최근 본 것 중 아무거나")["sort"] == "random"
    assert _extract_meta("인기 있는 것 중 아무거나 3개")["sort"] == "random"
    assert _extract_meta("요즘 많이 본 영상")["sort"] == "popular"


def test_non_intent_queries_unaffected():
    assert "sort" not in _extract_meta("2023년 7월 S1 평점 4 이상")
    assert _extract_meta("최근에 본 거")["sort"] == "recent"
    # '재생 5회 이상' 은 min_play 이지 popular 가 아니다
    m = _extract_meta("재생 5회 이상")
    assert m.get("min_play") == 5 and "sort" not in m


def test_extract_count():
    assert _extract_count("아무거나 10개만 추천해") == 10
    assert _extract_count("가장 인기 있는 10개 보여줘") == 10
    assert _extract_count("랜덤 5편") == 5
    assert _extract_count("3건만") == 3
    assert _extract_count("추천해줘") is None
    # 평점 표현의 숫자는 개수로 오해하지 않는다
    assert _extract_count("별점 4개 이상") is None
    assert _extract_count("평점 5개 짜리 아무거나 7개") == 7
    # 상한 100
    assert _extract_count("999개") == 100


def test_core_terms_leaves_only_core_nouns():
    assert _core_terms("아무거나 10개만 추천해") == ""
    assert _core_terms("랜덤으로 5편 골라줘") == ""
    assert _core_terms("2023년 작품 중에서 아무거나") == ""
    assert _core_terms("지금 볼 수 있는 것 중 무작위 3개") == ""
    assert _core_terms("가장 인기 있는 10개 보여줘") == ""
    assert _core_terms("많이 본 영상 순으로 5개") == ""
    # 테마·배우 같은 핵심 명사는 남는다
    assert _core_terms("온천 나오는 거 아무거나 5개") == "온천 나오는"
    assert _core_terms("아무거나 며느리") == "며느리"
    assert _core_terms("가장 인기 있는 온천 영상 5개") == "온천"


def test_summarize_labels():
    def call(sort):
        return [{"function": {"name": "search_videos", "arguments": {"query": "", "sort": sort, "limit": 10}}}]
    results = [{"name": "search_videos", "args": {}, "result": [{"opus": "A"}] * 10}]
    assert _summarize_results(call("random"), results) == "10건을 찾았어요. · 조건: 무작위"
    assert _summarize_results(call("popular"), results) == "10건을 찾았어요. · 조건: 인기순"


def test_apply_sort_random_is_permutation():
    hits = [{"opus": str(i)} for i in range(20)]
    out = _apply_sort(hits, "random")
    assert len(out) == 20
    assert sorted(h["opus"] for h in out) == sorted(h["opus"] for h in hits)


def test_apply_sort_popular_by_usage():
    hits = [
        {"opus": "low", "play": 1, "rank": 0, "like_count": 0},
        {"opus": "high", "play": 40, "rank": 5, "like_count": 12},
        {"opus": "mid", "play": 5, "rank": 3, "like_count": 1},
    ]
    assert [h["opus"] for h in _apply_sort(hits, "popular")] == ["high", "mid", "low"]


def test_extract_tags_groups_or_connectives(monkeypatch):
    # DB 대신 고정 태그 목록(길이 내림차순)으로 대체 — 순수 문자열 로직만 검증
    monkeypatch.setattr(router, "_known_tags", lambda: ["사무실", "온천", "음란", "질펀"])
    # 선택 접속어로 이어진 태그는 한 OR 그룹, 그 외는 각각 AND 그룹
    assert _extract_tags("사무실이나 온천에서 음란하고 질펀하게") == [
        ["사무실", "온천"],
        ["음란"],
        ["질펀"],
    ]
    for q in ("사무실 또는 온천", "사무실 혹은 온천", "사무실이거나 온천", "사무실이든지 온천"):
        assert _extract_tags(q) == [["사무실", "온천"]], q
    # 접속어 뒤에 태그가 아닌 말이 끼면 짝이 없으므로 묶지 않는다
    assert _extract_tags("온천 아니면 집에서 음란하게") == [["온천"], ["음란"]]
    # 접속어가 없으면 종전대로 전부 AND
    assert _extract_tags("온천 음란") == [["온천"], ["음란"]]
