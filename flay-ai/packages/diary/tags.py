"""일기 태그 추출 — 사용자가 쓴 일기(user 행)에서 검색용 #태그를 LLM 으로 뽑아 저장한다.

무엇을: 일기 본문(role='user' 의 content, LLM 노트·요약은 제외)에서 인물·장소·상황·주제 등
        검색에 쓸 태그를 범주 없이 평면으로 추출한다. 사람 이름은 성·이름 표기를 한 사람으로 통일한다.
왜:     회상(벡터·FTS)은 "비슷한 내용"을 찾고, 태그는 "정확히 그 사람/그 장소"를 찾는다. 둘을 합쳐
        '소현이 나온 일기 중 비슷한 상황' 같은 검색이 가능해진다.
입출력: 본문 텍스트 → Ollama(diary_llm, JSON 모드) → {"persons": [...], "tags": [...]}
        → 검증·정규화 → diary_tags(message_id, tag, source) + diary_tag_runs(sig).

사람 이름 규칙(diary_persons: alias → canonical):
- 성+이름(3~4자)이 한 번이라도 등장하면 그것이 대표 표기. 이름만(2자) 등장하면 대표의 뒷부분과
  맞춰 같은 사람으로 본다('소현' → '최소현'). 성+이름이 끝내 안 나오면 이름이 대표.
- 호칭(씨·님)·조사(이가·이는·이·가·은·는·을·를)는 뗀다('소현이가' → '소현').
- 프롬프트에 '알려진 사람' 목록을 넣어 LLM 단계에서도 통일을 유도하고, 코드가 최종 확정한다.

CLI (cwd = flay-ai):
  python -m packages.diary.tags --latest 2 --dry-run   # 최근 2편만 뽑아 보고(저장 안 함)
  python -m packages.diary.tags --all [--force]        # 전체(이미 같은 sig 로 뽑은 일기는 skip)
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import re
import sqlite3
from datetime import datetime
from typing import Any

import httpx

from packages.diary import prompts
from packages.rag.router import _ollama_url
from packages.settings import load_config

log = logging.getLogger(__name__)

# 태그 한 개 길이·개수 상한(LLM 이 문장을 태그로 내는 것을 막는다)
_TAG_MAX_LEN = 12
_TAG_MAX_COUNT = 30
# 본문에 없는 태그(감정·분위기) 허용 개수 — 모델이 지어낸 합성어가 검색어로 번지는 것을 막는다
_ABSTRACT_MAX = 2
# 사람 이름 뒤에 붙는 호칭·조사. 긴 것부터(이가·이는 이 이·가 보다 먼저)
_NAME_SUFFIX_RE = re.compile(r"(씨|님|이가|이는|이랑|이와|이도|이를|이|가|은|는|을|를|랑|와|과|도)$")
# 본문의 '[사진: …]'/'[동영상: …]' 캡션 마커 — 본문이 아니므로 추출 입력에서 제외
_MARKER_RE = re.compile(r"\[(사진|동영상|이미지)[^\]]*\]")


# ---- 사람 이름 정규화 ------------------------------------------------------


def strip_name_suffix(name: str) -> str:
    """'소현이가' → '소현', '최소현씨' → '최소현'. 2자 미만으로 줄어들면 원본 유지."""
    s = name.strip().lstrip("#").strip()
    m = _NAME_SUFFIX_RE.search(s)
    if m and len(s) - len(m.group(0)) >= 2:
        s = s[: -len(m.group(0))]
    return s


class PersonRegistry:
    """alias → canonical 사전(diary_persons 의 메모리 사본). dry-run 때는 DB 에 쓰지 않는다."""

    def __init__(self, rows: dict[str, str] | None = None) -> None:
        self.map: dict[str, str] = dict(rows or {})
        self.dirty: dict[str, str] = {}

    @classmethod
    def load(cls, conn: sqlite3.Connection) -> PersonRegistry:
        rows = conn.execute("SELECT alias, canonical FROM diary_persons").fetchall()
        return cls({r["alias"]: r["canonical"] for r in rows})

    def canonicals(self) -> list[str]:
        return sorted(set(self.map.values()))

    def _set(self, alias: str, canonical: str) -> None:
        if self.map.get(alias) != canonical:
            self.map[alias] = canonical
            self.dirty[alias] = canonical

    def resolve(self, raw: str) -> str | None:
        """본문 표기 하나를 대표 표기로. 새 사람이면 등록. 빈/이상한 값은 None."""
        name = strip_name_suffix(raw)
        if not (2 <= len(name) <= 4) or not re.fullmatch(r"[가-힣]+", name):
            return None
        if name in self.map:
            return self.map[name]
        # 이름만(2자): 성+이름 대표의 뒷부분과 맞으면 그 사람
        if len(name) == 2:
            for canon in self.canonicals():
                if len(canon) >= 3 and canon.endswith(name):
                    self._set(name, canon)
                    return canon
            self._set(name, name)
            return name
        # 성+이름(3~4자): 대표로 등록. 이름만 대표로 등록돼 있던 사람은 이쪽으로 병합
        given = name[1:]
        for alias, canon in list(self.map.items()):
            if canon == given:
                self._set(alias, name)
        self._set(name, name)
        self._set(given, name)
        return name

    def save(self, conn: sqlite3.Connection) -> None:
        for alias, canon in self.dirty.items():
            conn.execute(
                "INSERT INTO diary_persons(alias, canonical) VALUES(?,?) "
                "ON CONFLICT(alias) DO UPDATE SET canonical = excluded.canonical",
                (alias, canon),
            )
        conn.commit()
        self.dirty.clear()


# ---- LLM 추출 ----------------------------------------------------------------


def _sig() -> str:
    """모델명 + 프롬프트 해시. 바뀌면 기존 태그는 재추출 대상."""
    raw = load_config()["models"]["diary_llm"] + "\n" + prompts.tags_prompt()
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def _clean_tag(tag: Any) -> str:
    s = str(tag).strip().lstrip("#").strip().strip("'\"“”‘’")
    s = re.sub(r"\s+", " ", s)
    return s


def norm_key(s: str) -> str:
    """표기 비교 키: 공백 제거 + 영문 소문자. '사옥 이전'/'사옥이전', 'Coffee'/'coffee' 를 같게."""
    return re.sub(r"\s+", "", s).lower()


def load_tag_aliases(conn: sqlite3.Connection) -> dict[str, str]:
    """diary_tag_aliases → {norm_key(alias): canonical}."""
    rows = conn.execute("SELECT alias, canonical FROM diary_tag_aliases").fetchall()
    return {norm_key(r["alias"]): r["canonical"] for r in rows}


def known_tags(conn: sqlite3.Connection, limit: int = 300) -> list[str]:
    """기존 태그(건수순) — 프롬프트에 넣어 같은 뜻이면 같은 표기를 쓰게 한다."""
    rows = conn.execute(
        "SELECT tag FROM diary_tags GROUP BY tag ORDER BY COUNT(*) DESC, tag LIMIT ?", (limit,)
    ).fetchall()
    return [r["tag"] for r in rows]


def rejected_tags(conn: sqlite3.Connection) -> dict[str, int]:
    """화면에서 지운 태그별 횟수 {tag: count} (diary_tags.source='rejected')."""
    rows = conn.execute(
        "SELECT tag, COUNT(*) AS n FROM diary_tags WHERE source = 'rejected' GROUP BY tag"
    ).fetchall()
    return {r["tag"]: int(r["n"]) for r in rows}


def entry_rejected(conn: sqlite3.Connection, message_id: int) -> set[str]:
    """이 일기에서 지운 태그(norm_key) — 재추출 때 돌아오지 않게."""
    rows = conn.execute(
        "SELECT tag FROM diary_tags WHERE message_id = ? AND source = 'rejected'", (message_id,)
    ).fetchall()
    return {norm_key(r["tag"]) for r in rows}


def reject_block_threshold() -> int:
    return int(load_config().get("diary", {}).get("tag_reject_block", 2))


async def extract_tags_llm(
    text: str,
    known_persons: list[str],
    existing_tags: list[str] | None = None,
    excluded_tags: list[str] | None = None,
) -> dict[str, list[str]]:
    """본문 → LLM(JSON 모드) → {"persons": [...], "tags": [...]} (원시 결과, 검증 전)."""
    system = prompts.tags_prompt()
    if known_persons:
        system += "\n알려진 사람: " + ", ".join(known_persons)
    if existing_tags:
        system += "\n기존 태그: " + ", ".join(existing_tags)
    if excluded_tags:
        system += "\n제외 태그: " + ", ".join(excluded_tags)
    payload = {
        "model": load_config()["models"]["diary_llm"],
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": text},
        ],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2, "top_p": 0.9, "num_predict": 400},
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(_ollama_url("/api/chat"), json=payload, timeout=180.0)
        r.raise_for_status()
        content = (r.json().get("message") or {}).get("content") or "{}"
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        log.warning("tags: JSON 파싱 실패: %r", content[:200])
        return {"persons": [], "tags": []}
    persons = data.get("persons") if isinstance(data, dict) else None
    tags = data.get("tags") if isinstance(data, dict) else None
    return {
        "persons": [str(x) for x in persons] if isinstance(persons, list) else [],
        "tags": [str(x) for x in tags] if isinstance(tags, list) else [],
    }


def finalize_tags(
    raw: dict[str, list[str]],
    text: str,
    registry: PersonRegistry,
    aliases: dict[str, str] | None = None,
    blocked: set[str] | None = None,
) -> list[dict[str, Any]]:
    """LLM 원시 결과 → 저장용 태그 목록 [{tag, person, in_text}].

    - persons: 호칭·조사 제거 → 사전으로 대표 표기 확정. 본문에 그 이름(또는 대표의 이름 부분)이
      실제로 없으면 버린다(환각 방지).
    - tags: 별칭 사전(aliases: norm_key → canonical) 적용, 제외(blocked: norm_key — 이 일기에서
      지운 태그 + 전역 임계값 이상 거부된 태그) 필터, 길이·개수 상한, 표기 키(norm_key) 기준
      중복 제거. in_text 는 본문 등장 여부(공백 무시, 검증 보고용 — 추상 태그는 False 가능).
    """
    aliases = aliases or {}
    text_key = norm_key(text)
    out: list[dict[str, Any]] = []
    seen: set[str] = set(blocked or ())  # norm_key 들 — 제외 태그는 처음부터 '본 것'으로 취급
    abstract = 0

    def _add(tag: str, person: bool, in_text: bool) -> None:
        k = norm_key(tag)
        if k in seen:
            return
        seen.add(k)
        out.append({"tag": tag, "person": person, "in_text": in_text})

    for p in raw.get("persons", []):
        canon = registry.resolve(p)
        if not canon:
            continue
        given = canon[1:] if len(canon) >= 3 else canon
        if given not in text and strip_name_suffix(p) not in text:
            continue
        _add(canon, True, True)
    for t in raw.get("tags", []):
        tag = _clean_tag(t)
        if not tag or len(tag) > _TAG_MAX_LEN:
            continue
        # 사람 이름이 tags 쪽에 섞여 오면 persons 와 같은 규칙으로 흡수
        if tag in registry.map:
            _add(registry.map[tag], True, True)
            continue
        tag = aliases.get(norm_key(tag), tag)
        in_text = norm_key(tag) in text_key
        # 본문에 없는 말(감정·분위기나 모델이 지어낸 합성어)은 앞에서부터 _ABSTRACT_MAX 개까지만
        if not in_text:
            if abstract >= _ABSTRACT_MAX:
                continue
            abstract += 1
        _add(tag, False, in_text)
        if len(out) >= _TAG_MAX_COUNT:
            break
    return out


def entry_text(content: str) -> str:
    """추출 입력: 캡션 마커 제거 + 공백 정리."""
    return re.sub(r"[ \t]+", " ", _MARKER_RE.sub("", content or "")).strip()


# ---- 저장 ------------------------------------------------------------------


def save_tags(conn: sqlite3.Connection, message_id: int, tags: list[str], sig: str) -> None:
    """LLM 태그를 교체 저장(수동 태그는 보존) + 실행 sig 기록."""
    conn.execute("DELETE FROM diary_tags WHERE message_id = ? AND source = 'llm'", (message_id,))
    conn.executemany(
        "INSERT OR IGNORE INTO diary_tags(message_id, tag, source) VALUES(?,?,'llm')",
        [(message_id, t) for t in tags],
    )
    conn.execute(
        "INSERT INTO diary_tag_runs(message_id, sig, updated_at) VALUES(?,?,?) "
        "ON CONFLICT(message_id) DO UPDATE SET sig = excluded.sig, updated_at = excluded.updated_at",
        (message_id, sig, datetime.now().isoformat(timespec="seconds")),
    )
    conn.commit()


def entry_tags(conn: sqlite3.Connection, message_id: int) -> list[dict[str, Any]]:
    """화면용: 이 일기의 태그 [{tag, source, person}] (rejected 제외, 사람은 사전 기준)."""
    persons = {r["canonical"] for r in conn.execute("SELECT canonical FROM diary_persons")}
    rows = conn.execute(
        "SELECT tag, source FROM diary_tags WHERE message_id = ? AND source != 'rejected' "
        "ORDER BY CASE source WHEN 'llm' THEN 0 ELSE 1 END, rowid",
        (message_id,),
    ).fetchall()
    return [{"tag": r["tag"], "source": r["source"], "person": r["tag"] in persons} for r in rows]


def all_tags(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    """태그 목록 [{tag, count, person}] (거부 제외, 건수순) — 태그 관리·필터 화면용."""
    persons = {r["canonical"] for r in conn.execute("SELECT canonical FROM diary_persons")}
    rows = conn.execute(
        "SELECT tag, COUNT(*) AS n FROM diary_tags WHERE source != 'rejected' "
        "GROUP BY tag ORDER BY n DESC, tag"
    ).fetchall()
    return [{"tag": r["tag"], "count": int(r["n"]), "person": r["tag"] in persons} for r in rows]


def merge_tag(conn: sqlite3.Connection, alias: str, canonical: str) -> int:
    """태그 합치기: alias 가 붙은 일기를 canonical 로 바꾸고 별칭으로 기록(이후 추출에 자동 적용).

    같은 일기에 둘 다 있던 경우 alias 행은 지운다. 사람 이름이면 사람 사전도 함께 갱신.
    반환: 바뀐 일기 수.
    """
    alias, canonical = _clean_tag(alias), _clean_tag(canonical)
    if not alias or not canonical or norm_key(alias) == norm_key(canonical):
        return 0
    conn.execute(
        "DELETE FROM diary_tags WHERE tag = ? AND message_id IN "
        "(SELECT message_id FROM diary_tags WHERE tag = ?)",
        (alias, canonical),
    )
    cur = conn.execute("UPDATE diary_tags SET tag = ? WHERE tag = ?", (canonical, alias))
    conn.execute(
        "INSERT INTO diary_tag_aliases(alias, canonical) VALUES(?,?) "
        "ON CONFLICT(alias) DO UPDATE SET canonical = excluded.canonical",
        (alias, canonical),
    )
    conn.execute("UPDATE diary_tag_aliases SET canonical = ? WHERE canonical = ?", (canonical, alias))
    # 사람 사전: alias 가 대표였던 사람은 canonical 로
    conn.execute("UPDATE diary_persons SET canonical = ? WHERE canonical = ?", (canonical, alias))
    conn.commit()
    return int(cur.rowcount)


def rename_tag(conn: sqlite3.Connection, message_id: int, old: str, new: str) -> dict[str, Any]:
    """화면의 칩 수정(rename). 거부로 기록하지 않고 표기만 바꾼다(source 유지).

    - 사람 이름 rename(새 표기가 이미 사람 대표이거나 '여진'→'황여진'처럼 이름이 성+이름의 뒷부분):
      사람 사전에 old→new 를 등록하고 모든 일기의 old 를 new 로 바꾼다(같은 사람). scope='all'.
    - 그 외: 이 일기의 태그만 바꾼다. scope='entry'.
    반환: {scope, changed}
    """
    old, new = _clean_tag(old), _clean_tag(new)
    if not old or not new or len(new) > _TAG_MAX_LEN or old == new:
        return {"scope": "entry", "changed": 0}
    persons = {r["canonical"] for r in conn.execute("SELECT canonical FROM diary_persons")}
    hangul = re.fullmatch(r"[가-힣]{2,4}", old) and re.fullmatch(r"[가-힣]{2,4}", new)
    is_person = new in persons or bool(hangul and len(new) >= 3 and new.endswith(old))
    if is_person:
        for alias in {old, new, new[1:] if len(new) >= 3 else new}:
            conn.execute(
                "INSERT INTO diary_persons(alias, canonical) VALUES(?,?) "
                "ON CONFLICT(alias) DO UPDATE SET canonical = excluded.canonical",
                (alias, new),
            )
        conn.execute("UPDATE diary_persons SET canonical = ? WHERE canonical = ?", (new, old))
        conn.execute(
            "DELETE FROM diary_tags WHERE tag = ? AND message_id IN "
            "(SELECT message_id FROM diary_tags WHERE tag = ?)",
            (old, new),
        )
        cur = conn.execute("UPDATE diary_tags SET tag = ? WHERE tag = ?", (new, old))
        conn.commit()
        return {"scope": "all", "changed": int(cur.rowcount)}
    conn.execute(
        "DELETE FROM diary_tags WHERE message_id = ? AND tag = ? AND EXISTS "
        "(SELECT 1 FROM diary_tags WHERE message_id = ? AND tag = ?)",
        (message_id, old, message_id, new),
    )
    cur = conn.execute(
        "UPDATE diary_tags SET tag = ? WHERE message_id = ? AND tag = ?", (new, message_id, old)
    )
    conn.commit()
    return {"scope": "entry", "changed": int(cur.rowcount)}


def reject_tag(conn: sqlite3.Connection, message_id: int, tag: str) -> None:
    """화면의 삭제: LLM 태그는 'rejected' 로 바꿔 기억(재추출·제외 목록에 반영), 수동 태그는 삭제."""
    conn.execute(
        "DELETE FROM diary_tags WHERE message_id = ? AND tag = ? AND source = 'manual'",
        (message_id, tag),
    )
    conn.execute(
        "UPDATE diary_tags SET source = 'rejected' WHERE message_id = ? AND tag = ? AND source = 'llm'",
        (message_id, tag),
    )
    conn.commit()


def add_manual_tag(conn: sqlite3.Connection, message_id: int, tag: str) -> str | None:
    """화면의 추가: 표기 정리 후 'manual' 로 저장(거부돼 있던 태그면 되살림). 반환: 저장된 표기."""
    tag = _clean_tag(tag)
    if not tag or len(tag) > _TAG_MAX_LEN:
        return None
    conn.execute(
        "INSERT INTO diary_tags(message_id, tag, source) VALUES(?,?,'manual') "
        "ON CONFLICT(message_id, tag) DO UPDATE SET source = 'manual'",
        (message_id, tag),
    )
    conn.commit()
    return tag


async def tag_entry(
    conn: sqlite3.Connection,
    message_id: int,
    *,
    registry: PersonRegistry | None = None,
    dry_run: bool = False,
) -> list[dict[str, Any]]:
    """일기(user 행) 하나의 태그를 추출해 저장(dry_run 이면 저장 안 함). 반환: finalize_tags 결과."""
    row = conn.execute(
        "SELECT content FROM diary_messages WHERE id = ? AND role = 'user'", (message_id,)
    ).fetchone()
    if not row:
        return []
    text = entry_text(row["content"])
    if not text:
        return []
    reg = registry or PersonRegistry.load(conn)
    rejected = rejected_tags(conn)
    excluded = sorted(rejected, key=lambda t: -rejected[t])[:100]
    threshold = reject_block_threshold()
    blocked = {norm_key(t) for t, n in rejected.items() if n >= threshold}
    blocked |= entry_rejected(conn, message_id)
    raw = await extract_tags_llm(text, reg.canonicals(), known_tags(conn), excluded)
    tags = finalize_tags(raw, text, reg, load_tag_aliases(conn), blocked)
    if not dry_run:
        reg.save(conn)
        save_tags(conn, message_id, [t["tag"] for t in tags], _sig())
    return tags


def pending_entries(
    conn: sqlite3.Connection, *, latest: int | None = None, force: bool = False
) -> list[sqlite3.Row]:
    """추출 대상 user 행(최신순). force 가 아니면 현재 sig 로 이미 뽑은 일기는 제외."""
    sig = _sig()
    rows = conn.execute(
        "SELECT m.id, m.session_id, s.started_at, r.sig AS run_sig "
        "FROM diary_messages m JOIN diary_sessions s ON s.id = m.session_id "
        "LEFT JOIN diary_tag_runs r ON r.message_id = m.id "
        "WHERE m.role = 'user' AND length(trim(m.content)) > 0 ORDER BY s.started_at DESC"
    ).fetchall()
    if not force:
        rows = [r for r in rows if r["run_sig"] != sig]
    if latest:
        rows = rows[:latest]
    return rows


# ---- CLI -------------------------------------------------------------------


async def _main_async(args: argparse.Namespace) -> None:
    from packages.indexer.db import connect

    conn = connect()
    try:
        reg = PersonRegistry.load(conn)
        rows = pending_entries(conn, latest=args.latest, force=args.force or args.dry_run)
        print(f"대상 {len(rows)}편 (sig {_sig()}, dry_run={args.dry_run})")
        for r in rows:
            tags = await tag_entry(conn, int(r["id"]), registry=reg, dry_run=args.dry_run)
            date = str(r["started_at"])[:10]
            shown = " ".join(
                ("#" + t["tag"]) + ("(인물)" if t["person"] else "" if t["in_text"] else "(추상)")
                for t in tags
            )
            print(f"[{date}] msg {r['id']}: {shown}")
        if args.dry_run and reg.dirty:
            print("사람 사전(저장 안 함):", reg.dirty)
    finally:
        conn.close()


def main() -> None:
    ap = argparse.ArgumentParser(description="일기 태그 추출(LLM)")
    ap.add_argument("--latest", type=int, help="최근 N편만")
    ap.add_argument("--all", action="store_true", help="전체(미추출분)")
    ap.add_argument("--force", action="store_true", help="이미 뽑은 일기도 다시")
    ap.add_argument("--dry-run", action="store_true", help="저장하지 않고 결과만 출력")
    args = ap.parse_args()
    if not args.latest and not args.all:
        ap.error("--latest N 또는 --all 중 하나가 필요합니다")
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    asyncio.run(_main_async(args))


if __name__ == "__main__":
    main()
