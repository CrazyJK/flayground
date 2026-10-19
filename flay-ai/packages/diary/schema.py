"""일기 서브시스템 스키마: SQLite 테이블/FTS + Qdrant 컬렉션.

영상 검색 스키마(packages/indexer/db.py)와 같은 flay.db 를 공유하되 테이블은 완전히 분리.
멱등(IF NOT EXISTS) — init_diary_schema 를 매 기동마다 호출해도 안전.
"""

from __future__ import annotations

import logging
import sqlite3

from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

log = logging.getLogger(__name__)

# Qdrant 회상용 컬렉션 (bge-m3, 영상 컬렉션과 동일 차원)
DIARY_COLLECTION = "diary_messages"
DIARY_VECTOR_DIM = 1024

DIARY_SCHEMA = """
-- 일기 세션: '한 자리 대화' 또는 레거시 일기 하루치 ------------------------
CREATE TABLE IF NOT EXISTS diary_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at  TEXT NOT NULL,           -- ISO8601
  ended_at    TEXT,                    -- 마지막 메시지 시각(갱신)
  title       TEXT,                    -- 레거시 일기 제목 / 자동 요약 제목(nullable)
  weather     TEXT,                    -- 레거시 일기 날씨(nullable)
  summary     TEXT,                    -- 세션 요약(nullable)
  source_key  TEXT UNIQUE              -- 임포트 멱등 키(레거시 일기 date). 라이브 챗은 NULL
);

-- 일기 메시지: user(내 말) / assistant(맞장구·회상 답) ----------------------
CREATE TABLE IF NOT EXISTS diary_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES diary_sessions(id),
  role        TEXT NOT NULL,           -- 'user' | 'assistant'
  content     TEXT NOT NULL,           -- 검색·임베딩용 평문
  raw_html    TEXT,                    -- 풍부 표시용 원본 HTML(레거시 일기·이미지 포함, nullable)
  created_at  TEXT NOT NULL,           -- ISO8601
  source      TEXT NOT NULL DEFAULT 'chat',  -- 'chat' | 'diary_import'
  indexed     INTEGER NOT NULL DEFAULT 1     -- 회상 대상 여부(회상 질문은 0 — 오염 방지)
);
CREATE INDEX IF NOT EXISTS idx_diary_msg_session ON diary_messages(session_id);

-- 회상용 키워드 검색(한글 부분매칭): trigram FTS5 -------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS diary_messages_fts USING fts5(
  content, message_id UNINDEXED, session_id UNINDEXED, tokenize='trigram'
);

-- 일기 첨부 이미지 캡션 캐시(회상 시 사진을 보고 답하기 위함) -----------------
-- asset = diary_assets 파일명(sha1.ext, 내용 고정 → 캡션 1회 생성 후 재사용).
-- sig = 캡션 생성에 쓰인 설정(비전 모델·묘사 프롬프트·person_subs) 해시. 설정이 바뀌면
--       sig 불일치로 캐시 미스 → 자동 재생성(수동 DELETE 불필요).
CREATE TABLE IF NOT EXISTS diary_image_captions (
  asset    TEXT PRIMARY KEY,
  caption  TEXT NOT NULL,
  sig      TEXT NOT NULL DEFAULT ''
);

-- 일기 태그(검색용) — user 행(일기 본문) 하나에 태그 여러 개. 범주 없이 평면 #태그 ------
-- source = 'llm'(자동 추출) | 'manual'(화면에서 추가) | 'rejected'(화면에서 삭제한 LLM 태그).
-- rejected 행은 그 일기의 재추출에서 같은 태그가 돌아오지 않게 하고, 태그별 거부 횟수가
-- 제외 목록(프롬프트 힌트 + 임계값 이상이면 코드 필터)이 된다. 수동 태그는 재추출 때 보존.
CREATE TABLE IF NOT EXISTS diary_tags (
  message_id  INTEGER NOT NULL REFERENCES diary_messages(id),
  tag         TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'llm',
  PRIMARY KEY (message_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_diary_tags_tag ON diary_tags(tag);

-- 태그 추출 상태: 어떤 설정(모델·프롬프트 해시 = sig)으로 뽑았는지. 설정이 바뀌면 재추출 대상.
CREATE TABLE IF NOT EXISTS diary_tag_runs (
  message_id  INTEGER PRIMARY KEY REFERENCES diary_messages(id),
  sig         TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- 사람 이름 정규화 사전: alias(본문 표기: 소현·소현이·최소현) → canonical(대표 표기: 최소현) ----
CREATE TABLE IF NOT EXISTS diary_persons (
  alias      TEXT PRIMARY KEY,
  canonical  TEXT NOT NULL
);

-- 태그 별칭 사전: 화면에서 'A 를 B 로 합치기' 하면 alias=A, canonical=B. 이후 추출에서 A → B 자동 ----
CREATE TABLE IF NOT EXISTS diary_tag_aliases (
  alias      TEXT PRIMARY KEY,
  canonical  TEXT NOT NULL
);
"""


def init_diary_schema(conn: sqlite3.Connection) -> None:
    """일기 테이블/FTS 생성(멱등) + 마이그레이션."""
    conn.executescript(DIARY_SCHEMA)
    # 기존 DB 마이그레이션: indexed 컬럼 추가(CREATE TABLE IF NOT EXISTS 는 컬럼 추가 안 함)
    cols = {r[1] for r in conn.execute("PRAGMA table_info(diary_messages)")}
    if "indexed" not in cols:
        conn.execute("ALTER TABLE diary_messages ADD COLUMN indexed INTEGER NOT NULL DEFAULT 1")
    cap_cols = {r[1] for r in conn.execute("PRAGMA table_info(diary_image_captions)")}
    if cap_cols and "sig" not in cap_cols:
        conn.execute("ALTER TABLE diary_image_captions ADD COLUMN sig TEXT NOT NULL DEFAULT ''")
    conn.commit()


def ensure_diary_collection(client: QdrantClient) -> None:
    """Qdrant diary_messages 컬렉션 생성(멱등) + payload 인덱스."""
    existing = {c.name for c in client.get_collections().collections}
    if DIARY_COLLECTION in existing:
        return
    log.info("creating qdrant collection %s (size=%d, cosine)", DIARY_COLLECTION, DIARY_VECTOR_DIM)
    client.create_collection(
        collection_name=DIARY_COLLECTION,
        vectors_config=qm.VectorParams(size=DIARY_VECTOR_DIM, distance=qm.Distance.COSINE),
    )
    for field, ftype in [
        ("session_id", qm.PayloadSchemaType.INTEGER),
        ("message_id", qm.PayloadSchemaType.INTEGER),
        ("created_at_epoch", qm.PayloadSchemaType.INTEGER),
        ("role", qm.PayloadSchemaType.KEYWORD),
    ]:
        try:
            client.create_payload_index(DIARY_COLLECTION, field, field_schema=ftype)
        except Exception as e:
            log.debug("diary index create skipped %s: %s", field, e)
