"""공용 SSE 유틸(apps/api/sse.py) 단위 테스트 — 서버 기동 불필요.

pytest-asyncio 없이 asyncio.run() 헬퍼로 비동기 코드를 검증한다.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from apps.api.sse import HEARTBEAT_FRAME, Broadcaster, event_stream, poll_stream, sse_frame

# --- sse_frame ---------------------------------------------------


def test_sse_frame_format():
    frame = sse_frame({"type": "monitor", "값": 1})
    text = frame.decode("utf-8")
    assert text.startswith("data: ")
    assert text.endswith("\n\n")
    ev = json.loads(text[len("data: ") : -2])
    assert ev == {"type": "monitor", "값": 1}  # ensure_ascii=False — 한글 보존


def test_heartbeat_is_comment():
    assert HEARTBEAT_FRAME.startswith(b": ")  # SSE 코멘트 프레임 (EventSource 자동 무시)


# --- poll_stream -------------------------------------------------


def _parse(frame: bytes) -> dict[str, Any]:
    return json.loads(frame.decode("utf-8")[len("data: ") : -2])


def test_poll_stream_initial_push_and_dedupe():
    """접속 즉시 1회 push, 무변화면 재push 없음, 변화 시 push."""

    async def run() -> list[dict[str, Any]]:
        states = [{"n": 1}, {"n": 1}, {"n": 2}, {"n": 2, "done": True}]
        it = iter(states)

        async def fetch():
            return next(it)

        out: list[dict[str, Any]] = []
        gen = poll_stream(
            fetch,
            lambda s: {"type": "status", "job": s},
            interval=0.0,
            is_terminal=lambda s: bool(s.get("done")),
        )
        async for frame in gen:
            if frame != HEARTBEAT_FRAME:
                out.append(_parse(frame))
        return out

    events = asyncio.run(run())
    # {"n":1} 초기 push → 중복 {"n":1} 은 skip → {"n":2} push → 종료 상태 push 후 스트림 종료
    assert [e["job"] for e in events] == [{"n": 1}, {"n": 2}, {"n": 2, "done": True}]


def test_poll_stream_gone_on_none():
    async def run() -> list[dict[str, Any]]:
        states: list[Any] = [{"n": 1}, None]
        it = iter(states)

        async def fetch():
            return next(it)

        out = []
        async for frame in poll_stream(fetch, lambda s: {"type": "status", "job": s}, interval=0.0):
            if frame != HEARTBEAT_FRAME:
                out.append(_parse(frame))
        return out

    events = asyncio.run(run())
    assert events[-1] == {"type": "gone"}


# --- Broadcaster -------------------------------------------------


def test_broadcaster_lifecycle_and_cache():
    """첫 구독 시 샘플러 기동, 캐시 선적재, 마지막 구독 해지 시 샘플러 취소."""

    async def run() -> None:
        started = asyncio.Event()
        cancelled = asyncio.Event()

        async def sampler(bc: Broadcaster) -> None:
            started.set()
            bc.publish({"type": "tick", "n": 1}, cache_key="tick")
            try:
                await asyncio.sleep(3600)
            except asyncio.CancelledError:
                cancelled.set()
                raise

        bc = Broadcaster([sampler])
        assert bc.subscriber_count == 0

        q1 = bc.subscribe()
        await asyncio.wait_for(started.wait(), timeout=1)
        ev = await asyncio.wait_for(q1.get(), timeout=1)
        assert ev["type"] == "tick"

        # 두 번째 구독자는 캐시 스냅샷을 선적재 받는다
        q2 = bc.subscribe()
        ev2 = await asyncio.wait_for(q2.get(), timeout=1)
        assert ev2 == {"type": "tick", "n": 1}

        bc.unsubscribe(q1)
        assert not cancelled.is_set()  # 아직 구독자 남음 → 샘플러 유지
        bc.unsubscribe(q2)
        await asyncio.wait_for(cancelled.wait(), timeout=1)  # 마지막 해지 → 취소
        await bc.aclose()

    asyncio.run(run())


def test_event_stream_heartbeat_and_unsubscribe():
    """이벤트 없으면 하트비트, 스트림 종료 시 구독 해지."""

    async def run() -> None:
        bc = Broadcaster([])  # 샘플러 없음 → 이벤트 없음
        gen = event_stream(bc, heartbeat=0.01)
        frame = await asyncio.wait_for(gen.__anext__(), timeout=1)
        assert frame == HEARTBEAT_FRAME
        assert bc.subscriber_count == 1
        await gen.aclose()
        assert bc.subscriber_count == 0

    asyncio.run(run())
