"""공용 SSE(Server-Sent Events) 유틸.

프레임 컨벤션은 기존 채팅 SSE(main.py POST /api/chat)와 동일:
  - "data: <JSON>\\n\\n" 한 줄, 이벤트 타입은 JSON 안 "type" 필드
  - event:/id:/retry: 필드는 쓰지 않는다
하트비트는 SSE 코멘트 프레임(": ping\\n\\n") — EventSource 가 자동 무시하므로
클라이언트 코드가 필요 없다.

클라이언트 이탈 감지: Starlette StreamingResponse 는 클라이언트가 끊기면
제너레이터에 CancelledError 를 던지므로 finally 정리만으로 충분하다.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncGenerator, Awaitable, Callable, Coroutine, Sequence
from typing import Any

log = logging.getLogger(__name__)

SSE_HEADERS = {"Cache-Control": "no-cache"}
HEARTBEAT_FRAME = b": ping\n\n"


def sse_frame(ev: dict[str, Any]) -> bytes:
    """이벤트 dict 를 SSE data 프레임 bytes 로 인코딩한다."""
    return ("data: " + json.dumps(ev, ensure_ascii=False, default=str) + "\n\n").encode("utf-8")


class Broadcaster:
    """구독자 팬아웃 + 샘플러 수명 관리.

    - 첫 구독자 등장 시 샘플러 태스크들을 기동, 마지막 구독자 이탈 시 취소
      (탭이 하나도 없으면 nvidia-smi 등 백그라운드 수집이 완전히 멈춘다).
    - publish(cache_key=...) 로 키별 최신 이벤트를 캐시해 새 구독자 큐에 선적재
      → 접속 즉시 화면을 채울 스냅샷을 받는다.
    """

    def __init__(
        self,
        samplers: Sequence[Callable[[Broadcaster], Coroutine[Any, Any, None]]],
    ) -> None:
        self._samplers = list(samplers)
        self._queues: set[asyncio.Queue[dict[str, Any]]] = set()
        self._tasks: list[asyncio.Task[None]] = []
        self._cache: dict[str, dict[str, Any]] = {}

    @property
    def subscriber_count(self) -> int:
        return len(self._queues)

    def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        q: asyncio.Queue[dict[str, Any]] = asyncio.Queue(maxsize=8)
        for ev in self._cache.values():
            q.put_nowait(ev)
        self._queues.add(q)
        if len(self._queues) == 1 and not self._tasks:
            self._tasks = [asyncio.create_task(s(self)) for s in self._samplers]
        return q

    def unsubscribe(self, q: asyncio.Queue[dict[str, Any]]) -> None:
        self._queues.discard(q)
        if not self._queues:
            for t in self._tasks:
                t.cancel()
            self._tasks = []

    def publish(self, ev: dict[str, Any], *, cache_key: str | None = None) -> None:
        if cache_key:
            self._cache[cache_key] = ev
        for q in list(self._queues):
            # 느린 소비자 보호: 큐가 차면 가장 오래된 이벤트를 버린다(최신 우선)
            while q.full():
                try:
                    q.get_nowait()
                except asyncio.QueueEmpty:
                    break
            try:
                q.put_nowait(ev)
            except asyncio.QueueFull:
                pass

    async def aclose(self) -> None:
        """lifespan 종료 시 샘플러 태스크를 정리한다."""
        tasks, self._tasks = self._tasks, []
        for t in tasks:
            t.cancel()
        for t in tasks:
            try:
                await t
            except (asyncio.CancelledError, Exception):  # noqa: PERF203
                pass
        self._queues.clear()


async def event_stream(
    bc: Broadcaster, *, heartbeat: float = 15.0
) -> AsyncGenerator[bytes, None]:
    """Broadcaster 구독 → SSE 프레임 스트림. 유휴 시 하트비트로 연결 유지."""
    q = bc.subscribe()
    try:
        while True:
            try:
                ev = await asyncio.wait_for(q.get(), timeout=heartbeat)
            except TimeoutError:
                yield HEARTBEAT_FRAME
                continue
            yield sse_frame(ev)
    finally:
        bc.unsubscribe(q)


async def poll_stream(
    fetch: Callable[[], Awaitable[Any]],
    make_event: Callable[[Any], dict[str, Any]],
    *,
    interval: float | Callable[[Any], float],
    is_terminal: Callable[[Any], bool] = lambda _s: False,
    heartbeat: float = 15.0,
) -> AsyncGenerator[bytes, None]:
    """서버 내부 폴링 → 변화 시에만 push 하는 per-connection SSE 제너레이터.

    - 접속 즉시 1회 push(초기 스냅샷).
    - 이후 상태 JSON 비교로 실질 변화가 있을 때만 push (make_event 가 ts 등
      가변 필드를 덧붙여도 dedupe 에 영향 없도록 상태 기준으로 비교).
    - fetch 가 None 을 반환하면 {"type":"gone"} push 후 종료(잡 삭제 등).
    - is_terminal(state) 이면 해당 상태 push 후 스트림 종료.
    - interval 은 고정 초 또는 상태 기반 콜러블(예: 활성 잡 있으면 짧게).
    """
    last_key: str | None = None
    idle = 0.0
    while True:
        state = await fetch()
        if state is None:
            yield sse_frame({"type": "gone"})
            return
        key = json.dumps(state, ensure_ascii=False, default=str, sort_keys=True)
        if key != last_key:
            yield sse_frame(make_event(state))
            last_key = key
            idle = 0.0
        if is_terminal(state):
            return
        delay = interval(state) if callable(interval) else interval
        idle += delay
        if idle >= heartbeat:
            yield HEARTBEAT_FRAME
            idle = 0.0
        await asyncio.sleep(delay)
