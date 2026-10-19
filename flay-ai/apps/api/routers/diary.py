"""일기형 대화 API 라우터.

- POST /api/diary/chat          (SSE) 일기 쓰기 + 회상. 세션(=일기 한 편)은 서버가 결정:
                                첫 작성부터 entry_hours 안이면 이어 쓰고 넘으면 새 일기.
                                일기 저장 뒤 LLM 반응은 만들지 않고 태그를 추출해 tags 이벤트로
                                보낸다. 회상 질문은 저장 없이 답만 스트리밍.
- POST /api/diary/sessions/{id}/react  (SSE) 그 일기에 대한 LLM 반응(맞장구) — 화면 '반응' 버튼.
                                최종본은 세션 노트(assistant 행)로 저장.
- POST /api/diary/upload        동영상 업로드(multipart 스트리밍) → asset URL
- GET  /api/diary/sessions      세션 목록(요약, 히스토리)
- GET  /api/diary/history       이전 일기 열람(메시지 포함, 페이지네이션 + has_more, ?tag= 필터)
- GET  /api/diary/media         첨부 미디어 모아보기(이미지/동영상, 최신순 페이지네이션)
- POST /api/diary/sessions/{id}/summary  세션 일기 요약(30% 분량, 온디맨드·비저장)
- GET  /api/diary/sessions/{id} 세션 transcript(회상 카드·열람 공용)
- GET  /api/diary/tags          태그 목록(건수·사람 여부)
- POST /api/diary/tags/merge    태그 합치기 {alias, canonical}
- POST /api/diary/messages/{id}/tags           수동 태그 추가 {tag}
- PUT    /api/diary/messages/{id}/tags/{tag}   태그 rename {tag}(사람 이름이면 사전 등록 + 전체 적용)
- DELETE /api/diary/messages/{id}/tags/{tag}   태그 삭제(LLM 태그는 '거부'로 기억 → 제외 기준)
- POST /api/diary/messages/{id}/retag          그 일기 태그 재추출
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
from packages.diary import tags as diary_tags
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
    images: list[str] = Field(
        default_factory=list, description="첨부 이미지(data URL 또는 base64), 최대 8장"
    )
    videos: list[str] = Field(
        default_factory=list,
        description="업로드된 동영상 asset URL(/static/diary-assets/..), 최대 4개",
    )


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
    conn = connect()
    text = (req.query or "").strip()

    # 회상 질문(첨부 없는 순수 회상 요청)은 '기억'이 아니라 '물음' — 색인은 물론
    # 저장도 하지 않고 일기(세션)를 새로 열지도 않는다(질문·답이 일기 뷰와 '최근 일기'
    # 목록을 오염). 조회는 휘발, 일기엔 기록만 남는다. 화면에는 스트림으로 평소처럼 보인다.
    is_recall = not req.images and not req.videos and _looks_like_recall(text)
    history: list[dict] = []
    user_msg_id: int | None = None
    if is_recall:
        session_id = store.open_session(conn)  # 열린 일기가 있으면 그 id 만 알림(없으면 None)
        reply_query = text
    else:
        # 세션(=일기 한 편)은 서버가 결정: 첫 작성부터 entry_hours 안이면 이어 쓰고 넘으면 새로.
        session_id = store.get_or_create_session(conn)
        prev = store.session_entry(conn, session_id)  # 이 일기에 지금까지 쓴 글(누적 답변 컨텍스트)
        if prev:
            history = [{"role": "user", "content": prev["content"]}]
        if req.images or req.videos:
            store_content, raw_html, reply_query = await _prepare_media(
                cfg, text, req.images, req.videos
            )
        else:
            store_content, raw_html, reply_query = text, None, text
        # 일기 본문에 이어 붙여 저장(user 행 1개 유지, 재색인·재임베딩). 이미지 묘사가
        # content 에 합류해 회상 가능.
        user_msg_id = store.append_entry(
            conn, session_id, store_content, raw_html=raw_html, embed=True
        )

    async def sse() -> AsyncGenerator[bytes, None]:
        # 세션 식별자를 먼저 알려 프론트가 같은 일기인지 판단하게(회상만 한 경우 생략될 수 있음)
        if session_id is not None:
            yield _sse_bytes({"type": "session", "session_id": session_id})
        try:
            if is_recall:
                # 회상: 답만 스트리밍, 저장 없음
                async for ev in route_diary_chat(conn, reply_query, history=history):
                    yield _sse_bytes(ev)
            else:
                # 일기 저장: LLM 반응은 만들지 않는다(화면의 '반응' 버튼 → /react).
                # 대신 이 일기 전체의 태그를 다시 뽑아 보낸다(글을 이어 쓰면 태그도 갱신).
                assert user_msg_id is not None
                tag_list = await diary_tags.tag_entry(conn, user_msg_id)
                yield _sse_bytes(
                    {
                        "type": "tags",
                        "message_id": user_msg_id,
                        "tags": diary_tags.entry_tags(conn, user_msg_id),
                        "extracted": len(tag_list),
                    }
                )
                yield _sse_bytes({"type": "done", "message": ""})
        except Exception as e:
            log.exception("diary chat error: %s", e)
            yield _sse_bytes({"type": "error", "message": str(e)})
        finally:
            conn.close()

    return StreamingResponse(
        sse(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"}
    )


def _sse_bytes(ev: dict[str, Any]) -> bytes:
    return ("data: " + json.dumps(ev, ensure_ascii=False, default=str) + "\n\n").encode()


@router.post("/api/diary/sessions/{session_id}/react")
async def diary_session_react(session_id: int):
    """(SSE) 그 일기에 대한 LLM 반응(맞장구) — 화면의 '반응' 버튼. 자동으로는 만들지 않는다.

    이벤트: token / done(정리된 최종본) / error. 최종본은 세션 노트(assistant 행, 1개)로 저장.
    """
    conn = connect()
    entry = store.session_entry(conn, session_id)
    if not entry or not (entry.get("content") or "").strip():
        conn.close()
        raise HTTPException(404, "session has no entry")
    history = [{"role": "user", "content": entry["content"]}]

    async def sse() -> AsyncGenerator[bytes, None]:
        full = ""
        final = ""
        try:
            async for ev in route_diary_chat(conn, "", history=history):
                t = ev.get("type")
                if t == "token":
                    full += str(ev.get("text") or "")
                elif t == "done":
                    final = str(ev.get("message") or "")
                yield _sse_bytes(ev)
        except Exception as e:
            log.exception("diary react error: %s", e)
            yield _sse_bytes({"type": "error", "message": str(e)})
        finally:
            saved = (final or full).strip()
            if saved:
                store.set_reply(conn, session_id, saved)
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
def diary_history(limit: int = 5, offset: int = 0, tag: str | None = None) -> dict[str, Any]:
    """이전 일기 열람 — 메시지 포함 세션 한 페이지(최신순) + has_more. tag 를 주면 그 태그가 붙은 일기만.

    프론트는 화면 채울 만큼만(limit) 받고, 위로 스크롤할 때 offset 을 늘려 더 과거를 prepend.
    user 메시지에는 tags([{tag, source, person}]) 가 붙는다.
    """
    conn = connect()
    try:
        items, has_more = store.list_history(conn, limit=limit, offset=offset, tag=tag)
        for s in items:
            for m in s["messages"]:
                if m.get("role") == "user" and m.get("id") is not None:
                    m["tags"] = diary_tags.entry_tags(conn, int(m["id"]))
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


# --- 태그 ---------------------------------------------------------------


class TagBody(BaseModel):
    tag: str = Field(..., min_length=1, max_length=40)


class TagMergeBody(BaseModel):
    alias: str = Field(..., min_length=1, max_length=40, description="없어질 표기")
    canonical: str = Field(..., min_length=1, max_length=40, description="남길 표기")


@router.get("/api/diary/tags")
def diary_tags_list() -> dict[str, Any]:
    """태그 목록(건수순) — 필터·태그 관리 화면용."""
    conn = connect()
    try:
        return {"items": diary_tags.all_tags(conn)}
    finally:
        conn.close()


@router.post("/api/diary/tags/merge")
def diary_tags_merge(body: TagMergeBody) -> dict[str, Any]:
    """태그 합치기: alias 가 붙은 일기를 canonical 로 바꾸고 별칭으로 기록(이후 추출에 자동 적용)."""
    conn = connect()
    try:
        changed = diary_tags.merge_tag(conn, body.alias, body.canonical)
        return {"changed": changed, "items": diary_tags.all_tags(conn)}
    finally:
        conn.close()


def _user_message_or_404(conn, message_id: int) -> None:
    row = conn.execute(
        "SELECT 1 FROM diary_messages WHERE id = ? AND role = 'user'", (message_id,)
    ).fetchone()
    if not row:
        raise HTTPException(404, "message not found")


@router.post("/api/diary/messages/{message_id}/tags")
def diary_tag_add(message_id: int, body: TagBody) -> dict[str, Any]:
    """수동 태그 추가(거부돼 있던 태그면 되살림)."""
    conn = connect()
    try:
        _user_message_or_404(conn, message_id)
        if diary_tags.add_manual_tag(conn, message_id, body.tag) is None:
            raise HTTPException(400, "태그는 1~12자")
        return {"tags": diary_tags.entry_tags(conn, message_id)}
    finally:
        conn.close()


@router.put("/api/diary/messages/{message_id}/tags/{tag}")
def diary_tag_rename(message_id: int, tag: str, body: TagBody) -> dict[str, Any]:
    """태그 rename(거부 아님). 사람 이름이면 사전 등록 + 모든 일기에 적용(scope=all), 아니면 이 일기만."""
    conn = connect()
    try:
        _user_message_or_404(conn, message_id)
        res = diary_tags.rename_tag(conn, message_id, tag, body.tag)
        return {**res, "tags": diary_tags.entry_tags(conn, message_id)}
    finally:
        conn.close()


@router.delete("/api/diary/messages/{message_id}/tags/{tag}")
def diary_tag_delete(message_id: int, tag: str) -> dict[str, Any]:
    """태그 삭제 — LLM 태그는 '거부'로 기억돼 재추출·제외 목록에 반영, 수동 태그는 삭제."""
    conn = connect()
    try:
        _user_message_or_404(conn, message_id)
        diary_tags.reject_tag(conn, message_id, tag)
        return {"tags": diary_tags.entry_tags(conn, message_id)}
    finally:
        conn.close()


@router.post("/api/diary/messages/{message_id}/retag")
async def diary_retag(message_id: int) -> dict[str, Any]:
    """그 일기의 태그 재추출(거부한 태그·제외 목록 반영). 수동 태그는 보존."""
    conn = connect()
    try:
        _user_message_or_404(conn, message_id)
        await diary_tags.tag_entry(conn, message_id)
        return {"tags": diary_tags.entry_tags(conn, message_id)}
    finally:
        conn.close()
