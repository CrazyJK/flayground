"""일기 마이그레이션: 라이브 세션의 여러 글/노트 행을 일기 한 편(user 1행 + assistant 1행)으로 병합.

세션(=일기 한 편) 안에서 엔터마다 따로 저장됐던 user 행은 첫 행에 이어 붙이고(FTS·임베딩
재색인, 나머지 행·포인트 삭제), assistant 행은 내용을 줄바꿈으로 누적한 노트 하나로 교체한다.
레거시 임포트 세션(source_key 존재)은 이미 1행이라 대상이 아니다. 멱등(재실행 시 변경 0건).

    ./.venv/Scripts/python.exe -m packages.diary.merge_entries [--dry-run] [--no-embed]
"""

from __future__ import annotations

import argparse
import logging

from packages.diary import store
from packages.diary.schema import init_diary_schema
from packages.indexer.db import connect

log = logging.getLogger(__name__)


def run(dry_run: bool = False, embed: bool = True) -> dict[str, int]:
    """병합 대상 라이브 세션(user 또는 assistant 행이 2개 이상)을 찾아 병합. 반환: 통계."""
    conn = connect()
    init_diary_schema(conn)
    try:
        rows = conn.execute(
            "SELECT s.id, "
            "  SUM(CASE WHEN m.role = 'user' THEN 1 ELSE 0 END) AS u, "
            "  SUM(CASE WHEN m.role = 'assistant' THEN 1 ELSE 0 END) AS a "
            "FROM diary_sessions s JOIN diary_messages m ON m.session_id = s.id "
            "WHERE s.source_key IS NULL GROUP BY s.id HAVING u > 1 OR a > 1 ORDER BY s.id"
        ).fetchall()
        stats = {"targets": len(rows), "merged": 0}
        for r in rows:
            log.info("session %s: user %d -> 1, assistant %d -> 1", r["id"], r["u"], r["a"])
            if dry_run:
                continue
            if store.merge_session_entries(conn, int(r["id"]), embed=embed):
                stats["merged"] += 1
        return stats
    finally:
        conn.close()


def main() -> None:
    ap = argparse.ArgumentParser(description="일기 세션 행 병합 마이그레이션")
    ap.add_argument("--dry-run", action="store_true", help="대상만 출력하고 변경하지 않음")
    ap.add_argument("--no-embed", action="store_true", help="임베딩/Qdrant 갱신 생략(FTS만)")
    args = ap.parse_args()
    logging.basicConfig(level="INFO", format="%(asctime)s %(levelname)s %(name)s %(message)s")
    stats = run(dry_run=args.dry_run, embed=not args.no_embed)
    log.info("완료: 대상 %(targets)d, 병합 %(merged)d", stats)


if __name__ == "__main__":
    main()
