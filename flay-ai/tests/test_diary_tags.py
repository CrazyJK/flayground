"""diary tags 단위 테스트 — LLM 없이 이름 정규화·태그 검증·거부/수동 저장 경로만."""

from __future__ import annotations

import pytest

from packages.diary import store, tags
from packages.diary.schema import init_diary_schema
from packages.indexer.db import connect


@pytest.fixture
def conn(tmp_path):
    c = connect(path=tmp_path / "diary_tags_test.db")
    init_diary_schema(c)
    yield c
    c.close()


# --- 사람 이름 ------------------------------------------------------------


def test_strip_name_suffix():
    assert tags.strip_name_suffix("소현이가") == "소현"
    assert tags.strip_name_suffix("최소현씨") == "최소현"
    assert tags.strip_name_suffix("#혜린이는") == "혜린"
    # 2자 미만으로 줄어들면 원본 유지
    assert tags.strip_name_suffix("이가") == "이가"


def test_person_registry_merges_given_name_into_full_name():
    reg = tags.PersonRegistry()
    # 성+이름이 먼저 → 이름만 나와도 같은 사람
    assert reg.resolve("최소현") == "최소현"
    assert reg.resolve("소현이가") == "최소현"
    # 이름만 먼저 등록된 사람은 나중에 성+이름이 나오면 그쪽으로 병합
    assert reg.resolve("혜린") == "혜린"
    assert reg.resolve("신혜린") == "신혜린"
    assert reg.map["혜린"] == "신혜린"
    # 이상한 값은 None
    assert reg.resolve("a") is None
    assert reg.resolve("우리회사사람들") is None


# --- 태그 검증 ------------------------------------------------------------


def _reg() -> tags.PersonRegistry:
    reg = tags.PersonRegistry()
    reg.resolve("최소현")
    return reg


def test_finalize_filters_and_normalizes():
    text = "오늘 소현이가 사옥 이전 얘기를 했다. 커피를 마셨다."
    raw = {
        "persons": ["소현이가", "홍길동"],  # 홍길동은 본문에 없음 → 환각 제거
        "tags": ["사옥이전", "#커피", "커피", "첫번째추상", "두번째추상", "세번째추상", "x" * 20],
    }
    out = tags.finalize_tags(raw, text, _reg())
    got = [t["tag"] for t in out]
    assert got[0] == "최소현" and out[0]["person"]
    assert "홍길동" not in got
    assert got.count("커피") == 1
    assert "사옥이전" in got and next(t for t in out if t["tag"] == "사옥이전")["in_text"]
    # 본문에 없는 태그는 2개까지만, 너무 긴 태그는 제외
    assert "첫번째추상" in got and "두번째추상" in got and "세번째추상" not in got
    assert "x" * 20 not in got


def test_finalize_applies_aliases_and_blocked():
    text = "출근길에 아아를 샀다"
    raw = {"persons": [], "tags": ["아아", "출근길"]}
    out = tags.finalize_tags(
        raw, text, _reg(), aliases={"아아": "아이스아메리카노"}, blocked={tags.norm_key("출근길")}
    )
    assert [t["tag"] for t in out] == ["아이스아메리카노"]


# --- 저장 경로: 거부·수동 -------------------------------------------------


def test_reject_and_manual_flow(conn):
    sid = store.create_session(conn)
    mid = store.add_message(conn, sid, "user", "소현이와 커피", embed=False)
    tags.save_tags(conn, mid, ["최소현", "커피", "허벅지접촉"], sig="s1")
    assert [t["tag"] for t in tags.entry_tags(conn, mid)] == ["최소현", "커피", "허벅지접촉"]

    # 삭제 → rejected 로 기억: 화면 목록에서 빠지고, 거부 횟수에 잡히고, 재저장해도 돌아오지 않음
    tags.reject_tag(conn, mid, "허벅지접촉")
    assert "허벅지접촉" not in [t["tag"] for t in tags.entry_tags(conn, mid)]
    assert tags.rejected_tags(conn) == {"허벅지접촉": 1}
    assert tags.entry_rejected(conn, mid) == {tags.norm_key("허벅지접촉")}
    tags.save_tags(conn, mid, ["최소현", "커피", "허벅지접촉"], sig="s2")
    assert "허벅지접촉" not in [t["tag"] for t in tags.entry_tags(conn, mid)]

    # 수동 추가는 재추출(save_tags)에도 보존, 수동 태그 삭제는 그냥 삭제
    assert tags.add_manual_tag(conn, mid, " #야근 ") == "야근"
    tags.save_tags(conn, mid, ["최소현"], sig="s3")
    assert [t["tag"] for t in tags.entry_tags(conn, mid)] == ["최소현", "야근"]
    tags.reject_tag(conn, mid, "야근")
    assert [t["tag"] for t in tags.entry_tags(conn, mid)] == ["최소현"]
    assert "야근" not in tags.rejected_tags(conn)


def test_rename_person_applies_to_all_entries_and_registers_alias(conn):
    sid = store.create_session(conn)
    m1 = store.add_message(conn, sid, "user", "여진이와 커피", embed=False)
    sid2 = store.create_session(conn)
    m2 = store.add_message(conn, sid2, "user", "여진이 또 왔다", embed=False)
    tags.save_tags(conn, m1, ["여진", "커피"], sig="s")
    tags.save_tags(conn, m2, ["여진"], sig="s")

    res = tags.rename_tag(conn, m1, "여진", "황여진")
    assert res == {"scope": "all", "changed": 2}
    assert [t["tag"] for t in tags.entry_tags(conn, m1)] == ["황여진", "커피"]
    assert [t["tag"] for t in tags.entry_tags(conn, m2)] == ["황여진"]
    assert tags.entry_tags(conn, m1)[0]["person"] is True
    # 사전에 등록돼 이후 추출에서 '여진' 은 '황여진' 으로 통일, 거부로는 기록되지 않음
    assert tags.PersonRegistry.load(conn).resolve("여진이가") == "황여진"
    assert tags.rejected_tags(conn) == {}

    # 일반 태그 rename 은 이 일기만
    res = tags.rename_tag(conn, m1, "커피", "아이스커피")
    assert res == {"scope": "entry", "changed": 1}
    assert [t["tag"] for t in tags.entry_tags(conn, m1)] == ["황여진", "아이스커피"]
