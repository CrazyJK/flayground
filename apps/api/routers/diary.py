"""일기형 대화 API 라우터.

- POST /api/diary/chat          (SSE) 일상 대화 + 회상. 세션 자동 이어가기/생성.
- POST /api/diary/upload        동영상 업로드(multipart 스트리밍) → asset URL
- GET  /api/diary/sessions      세션 목록(요약, 히스토리)
- GET  /api/diary/history       이전 일기 열람(메시지 포함, 페이지네이션 + has_more)
- GET  /api/diary/media         첨부 미디어 모아보기(이미지/동영상, 최신순 페이지네이션)
- POST /api/diary/sessions/{id}/summary  세션 일기 요약(30% 분량, 온디맨드·비저장)
- GET  /api/diary/sessions/{id} 세션 transcript(회상 카드·열람 공용)
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from packages.diary import store
from packages.diary.chat import _looks_like_recall, route_diary_chat, summarize_session
from packages.diary.htmlutil import asset_names_from_html, build_message_html, save_upload_image
from packages.diary.vision import describe_images, describe_video
from packages.indexer.db import connect
from packages.settings import load_config, repo_path

log = logging.getLogger(__name__)
router = APIRouter()

# 한 메시지당 첨부 이미지/동영상 상한
MAX_IMAGES = 8
MAX_VIDEOS = 4
# 동영상 업로드 허용 타입(content-type → 확장자). 확장자 폴백도 같은 집합.
_VIDEO_TYPES = {"video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov"}
# 업로드된 동영상 asset 이름(sha1.확장자) — chat 의 videos URL 검증용
_VIDEO_ASSET_RE = re.compile(r"^[0-9a-f]{40}\.(mp4|webm|mov)$")
_ASSET_URL_PREFIX = "/static/diary-assets/"


class DiaryChatRequest(BaseModel):
    query: str = Field("", description="사용자 발화(이미지만 보낼 땐 비어도 됨)")
    session_id: int | None = Field(None, description="이어쓸 세션. 없으면 자동 결정")
    images: list[str] = Field(
        default_factory=list, description="첨부 이미지(data URL 또는 base64), 최대 8장"
    )
    videos: list[str] = Field(
        default_factory=list,
        description="업로드된 동영상 asset URL(/static/diary-assets/..), 최대 4개",
    )


def _recent_history(conn, session_id: int, limit: int) -> list[dict]:
    """현재 세션 최근 메시지를 LLM 컨텍스트용 [{role, content}] 로(시간순)."""
    rows = conn.execute(
        "SELECT role, content FROM diary_messages WHERE session_id = ? "
        "ORDER BY id DESC LIMIT ?",
        (session_id, limit),
    ).fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


def _valid_video_urls(cfg: dict, videos: list[str]) -> list[str]:
    """chat 의 videos 인자 검증 — 업로드된 diary_assets 파일(sha1.mp4|webm|mov)만 통과."""
    assets_dir = repo_path(cfg["data"].get("diary_assets", "data/diary_assets"))
    out: list[str] = []
    for url in videos[:MAX_VIDEOS]:
        name = url.rsplit("/", 1)[-1]
        if not url.startswith(_ASSET_URL_PREFIX) or not _VIDEO_ASSET_RE.match(name):
            continue
        if (assets_dir / name).exists():
            out.append(f"{_ASSET_URL_PREFIX}{name}")
    return out


async def _prepare_media(
    cfg: dict, text: str, images: list[str], videos: list[str]
) -> tuple[str, str | None, str]:
    """첨부 이미지/동영상 처리 → (저장용 content, raw_html, 응답 컨텍스트용 query).

    - 이미지: data/diary_assets 로 추출(raw_html 의 <img>) + 비전 묘사 '[사진: ...]'.
    - 동영상: 업로드된 asset URL 검증 → raw_html 의 <video> + 키프레임 묘사 '[동영상: ...]'.
    - 묘사는 content 에 합류해 회상(임베딩·FTS) 가능 + 응답 컨텍스트로도 사용.
    """
    imgs = images[:MAX_IMAGES]
    assets_dir = repo_path(cfg["data"].get("diary_assets", "data/diary_assets"))
    urls: list[str] = []
    for img in imgs:
        u = save_upload_image(img, assets_dir)
        if u:
            urls.append(u)
    video_urls = _valid_video_urls(cfg, videos)
    raw_html = build_message_html(text, urls, video_urls) if (urls or video_urls) else None

    # 비전 묘사는 블로킹 httpx → 이벤트 루프 막지 않게 스레드로
    caption = await asyncio.to_thread(describe_images, imgs) if imgs else ""
    # 동영상은 키프레임 추출(ffmpeg) 후 같은 VLM 으로 묘사. 지연을 묶기 위해 앞 2개만.
    video_markers: list[str] = []
    for vu in video_urls:
        vpath = assets_dir / vu.rsplit("/", 1)[-1]
        vcap = ""
        if len(video_markers) < 2:
            vcap = await asyncio.to_thread(describe_video, vpath)
        video_markers.append(f"[동영상: {vcap}]" if vcap else "[동영상]")

    photo = f"[사진: {caption}]" if caption else ("[사진]" if urls else "")
    parts = [p for p in (text, photo, *video_markers) if p]
    store_content = "\n".join(parts) or ("[동영상]" if video_urls else "[사진]")

    media_notes: list[str] = []
    if caption:
        media_notes.append(f"사진 내용: {caption}")
    for m in video_markers:
        if m != "[동영상]":
            media_notes.append(f"동영상 내용: {m[6:-1]}")
    if media_notes:
        note = " / ".join(media_notes)
        reply_query = f"{text}\n(방금 첨부: {note})" if text else f"(방금 사진/동영상을 올렸어. {note})"
    else:
        reply_query = text or "(방금 사진이나 동영상을 올렸어.)"
    return store_content, raw_html, reply_query


@router.post("/api/diary/chat")
async def diary_chat(req: DiaryChatRequest):
    cfg = load_config()
    ctx_n = int(cfg.get("diary", {}).get("context_messages", 12))

    conn = connect()
    # 세션 확보(이어가기/생성) + 직전 컨텍스트
    session_id = req.session_id or store.get_or_create_session(conn)
    history = _recent_history(conn, session_id, ctx_n)

    text = (req.query or "").strip()
    if req.images or req.videos:
        store_content, raw_html, reply_query = await _prepare_media(
            cfg, text, req.images, req.videos
        )
    else:
        store_content, raw_html, reply_query = text, None, text

    # 회상 질문(첨부 없는 순수 회상 요청)은 '기억'이 아니라 '물음' — 색인은 물론
    # 저장도 하지 않는다(질문·답이 일기 뷰와 '최근 일기' 목록을 오염). 조회는 휘발,
    # 일기엔 기록만 남는다. 화면에는 스트림으로 평소처럼 보인다.
    is_recall = not req.images and not req.videos and _looks_like_recall(text)
    user_msg_id: int | None = None
    if not is_recall:
        # 사용자 메시지 저장(임베딩까지). 이미지 묘사가 content 에 합류해 회상 가능.
        user_msg_id = store.add_message(
            conn, session_id, "user", store_content, raw_html=raw_html, embed=True
        )

    async def sse() -> AsyncGenerator[bytes, None]:
        def _emit(ev: dict[str, Any]) -> bytes:
            return ("data: " + json.dumps(ev, ensure_ascii=False, default=str) + "\n\n").encode(
                "utf-8"
            )

        # 세션 식별자를 먼저 알려 프론트가 이어쓰기 가능하게
        yield _emit({"type": "session", "session_id": session_id})
        full = ""
        final = ""
        try:
            async for ev in route_diary_chat(
                conn, reply_query, history=history, exclude_message_id=user_msg_id
            ):
                t = ev.get("type")
                if t == "token":
                    full += str(ev.get("text") or "")
                elif t == "done":
                    final = str(ev.get("message") or "")
                yield _emit(ev)
        except Exception as e:
            log.exception("diary chat error: %s", e)
            yield _emit({"type": "error", "message": str(e)})
        finally:
            # 어시스턴트 응답 저장 — 정리된 최종본(done) 우선(임베딩 안 함: 회상 대상은 내 말 위주).
            # 회상 답은 질문과 함께 저장하지 않는다.
            saved = (final or full).strip()
            if saved and not is_recall:
                store.add_message(conn, session_id, "assistant", saved, embed=False)
            conn.close()

    return StreamingResponse(
        sse(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"}
    )


@router.get("/api/diary/sessions")
def diary_sessions(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    conn = connect()
    try:
        return {"items": store.list_sessions(conn, limit=limit, offset=offset)}
    finally:
        conn.close()


@router.post("/api/diary/upload")
async def diary_upload(file: UploadFile) -> dict[str, Any]:
    """동영상 업로드(짧은 클립) — multipart 스트리밍 저장 → asset URL 반환.

    base64 JSON(이미지 경로)은 100MB 급에서 메모리 부담이 커서 동영상은 이 경로로만.
    파일명은 내용 SHA1(이미지와 동일 규칙, 중복 저장 방지·멱등). 상한 초과 시 413.
    """
    ext = _VIDEO_TYPES.get((file.content_type or "").lower())
    if not ext:
        name = (file.filename or "").lower()
        for e in ("mp4", "webm", "mov"):
            if name.endswith(f".{e}"):
                ext = e
                break
    if not ext:
        raise HTTPException(415, "mp4/webm/mov 동영상만 업로드할 수 있습니다")

    cfg = load_config()
    max_bytes = int(cfg["server"].get("upload_video_max_bytes", 100 * 1024 * 1024))
    assets_dir = repo_path(cfg["data"].get("diary_assets", "data/diary_assets"))
    assets_dir.mkdir(parents=True, exist_ok=True)

    h = hashlib.sha1()
    total = 0
    tmp = assets_dir / f".upload-{uuid.uuid4().hex}.tmp"
    try:
        with tmp.open("wb") as f:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(413, f"동영상은 {max_bytes // (1024 * 1024)}MB 이하만")
                h.update(chunk)
                f.write(chunk)
        if total == 0:
            raise HTTPException(400, "빈 파일")
        final = assets_dir / f"{h.hexdigest()}.{ext}"
        if not final.exists():
            tmp.replace(final)
        return {"url": f"{_ASSET_URL_PREFIX}{final.name}", "bytes": total}
    finally:
        tmp.unlink(missing_ok=True)


@router.get("/api/diary/history")
def diary_history(limit: int = 5, offset: int = 0) -> dict[str, Any]:
    """이전 일기 열람 — 메시지 포함 세션 한 페이지(최신순) + has_more.

    프론트는 화면 채울 만큼만(limit) 받고, 위로 스크롤할 때 offset 을 늘려 더 과거를 prepend.
    """
    conn = connect()
    try:
        items, has_more = store.list_history(conn, limit=limit, offset=offset)
        return {"items": items, "has_more": has_more}
    finally:
        conn.close()


_VIDEO_EXTS = {"mp4", "webm", "mov"}


@router.get("/api/diary/media")
def diary_media(limit: int = 60, offset: int = 0) -> dict[str, Any]:
    """일기에 첨부된 미디어(이미지/동영상) 모아보기 — 최신순.

    raw_html 에서 asset 이름을 추출해 평탄화(중복 asset 은 최신 1회만). 개인 규모
    (수백~수천 메시지)라 전량 추출 후 메모리에서 offset/limit 페이지네이션.
    """
    conn = connect()
    try:
        rows = conn.execute(
            "SELECT m.session_id, m.raw_html, m.created_at, s.source_key, s.started_at "
            "FROM diary_messages m JOIN diary_sessions s ON s.id = m.session_id "
            "WHERE m.raw_html IS NOT NULL AND m.raw_html != '' "
            "ORDER BY m.id DESC"
        ).fetchall()
    finally:
        conn.close()
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for r in rows:
        date = r["source_key"] or (r["started_at"] or "")[:10]
        for name in asset_names_from_html(r["raw_html"]):
            if name in seen:
                continue
            seen.add(name)
            ext = name.rsplit(".", 1)[-1].lower()
            items.append(
                {
                    "url": f"{_ASSET_URL_PREFIX}{name}",
                    "kind": "video" if ext in _VIDEO_EXTS else "image",
                    "date": date,
                    "session_id": int(r["session_id"]),
                    "created_at": r["created_at"],
                }
            )
    page = items[offset : offset + limit]
    return {"items": page, "has_more": offset + limit < len(items), "total": len(items)}


@router.post("/api/diary/sessions/{session_id}/summary")
async def diary_session_summary(session_id: int) -> dict[str, Any]:
    """세션 일기 요약(약 30% 분량, 첨부 설명 포함) — 이전 일기 '요약' 버튼. 저장 안 함."""
    conn = connect()
    try:
        res = await summarize_session(conn, session_id)
    finally:
        conn.close()
    if res is None:
        raise HTTPException(404, "session not found")
    if not res.get("too_short") and not res.get("summary"):
        raise HTTPException(502, "요약 생성 실패")
    return res


@router.get("/api/diary/sessions/{session_id}")
def diary_session_detail(session_id: int) -> dict[str, Any]:
    conn = connect()
    try:
        tr = store.get_session_transcript(conn, session_id)
        if not tr:
            raise HTTPException(404, "session not found")
        return tr
    finally:
        conn.close()
