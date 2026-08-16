"""관리자 SSE 스트림 — GET /api/admin/events.

브라우저 폴링(/monitor 1초, /services 5초·작업중 2초)을 서버 내부 샘플링 +
구독자 팬아웃 push 로 대체한다.

- 탭이 N개여도 샘플링(nvidia-smi, Qdrant/Ollama 조회)은 1회만 수행해 팬아웃.
- 구독자(탭)가 하나도 없으면 샘플러가 완전히 멈춘다(가시성 게이팅과 맞물림).
- 작업 시작/일시정지/재개·파이프라인 단계 전이 시 kick 으로 즉시 재샘플.
"""

from __future__ import annotations

import asyncio
import logging
import time

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from apps.api.routers import admin
from apps.api.sse import SSE_HEADERS, Broadcaster, event_stream

router = APIRouter(prefix="/api/admin", tags=["admin"])
log = logging.getLogger(__name__)

MONITOR_INTERVAL = 1.0  # 프론트 차트가 1초 해상도(60초 롤링 버퍼)를 전제 — 변경 금지
SERVICES_IDLE_INTERVAL = 5.0
SERVICES_BUSY_INTERVAL = 2.0

# services 즉시 재샘플 신호 (작업 상태 전이 시 set)
_services_kick = asyncio.Event()
# executor 스레드에서 kick 하기 위한 루프 참조 — lifespan 에서 bind_loop() 로 설정
_loop: asyncio.AbstractEventLoop | None = None


def bind_loop() -> None:
    """lifespan 기동 시 호출 — executor 스레드용 kick 이 쓸 루프를 잡아둔다."""
    global _loop
    _loop = asyncio.get_running_loop()


def kick_services() -> None:
    """services 샘플러에 즉시 재샘플을 요청한다(이벤트 루프 스레드에서 호출)."""
    _services_kick.set()


def kick_services_threadsafe() -> None:
    """executor 스레드(_wait_job_sync/_run_pipeline_sync)에서 안전하게 kick 한다."""
    loop = _loop
    if loop is not None and not loop.is_closed():
        loop.call_soon_threadsafe(_services_kick.set)


async def _monitor_sampler(bc: Broadcaster) -> None:
    """시스템 지표(CPU/RAM/GPU/VRAM)를 1초 격자로 수집·발행한다."""
    while True:
        t0 = time.monotonic()
        try:
            system = await asyncio.to_thread(admin._system_stats)
            bc.publish(
                {"type": "monitor", "ts": time.time(), "system": system},
                cache_key="monitor",
            )
        except Exception as e:
            log.warning("monitor sampler error: %s", e)
        # 수집 소요를 빼서 1초 격자 유지 (차트 x축 해상도의 근거)
        await asyncio.sleep(max(0.0, MONITOR_INTERVAL - (time.monotonic() - t0)))


async def _services_sampler(bc: Broadcaster) -> None:
    """Qdrant·Ollama·인덱서·작업 상태를 5초(작업중 2초) 주기로 수집·발행한다.

    kick(_services_kick) 이 오면 대기를 끊고 즉시 재샘플 — 작업 제어 직후
    지연 없이 상태가 반영된다(기존 600ms 지연 재폴링 대체).
    """
    while True:
        try:
            qdrant_data, ollama_data, indexer_data = await asyncio.gather(
                asyncio.to_thread(admin._qdrant_stats),
                admin._ollama_stats(),
                asyncio.to_thread(admin._indexer_stats),
            )
            bc.publish(
                {
                    "type": "services",
                    "ts": time.time(),
                    "qdrant": qdrant_data,
                    "ollama": ollama_data,
                    "indexer": indexer_data,
                    "jobs": dict(admin._running_jobs),
                },
                cache_key="services",
            )
        except Exception as e:
            log.warning("services sampler error: %s", e)
        busy = any(j.get("status") == "running" for j in admin._running_jobs.values())
        timeout = SERVICES_BUSY_INTERVAL if busy else SERVICES_IDLE_INTERVAL
        try:
            await asyncio.wait_for(_services_kick.wait(), timeout=timeout)
        except TimeoutError:
            pass
        # wait 이후에 clear — 샘플링 중 도착한 kick 을 잃지 않는다
        _services_kick.clear()


_broadcaster = Broadcaster([_monitor_sampler, _services_sampler])


async def shutdown() -> None:
    """lifespan 종료 시 샘플러 태스크 정리."""
    await _broadcaster.aclose()


@router.get("/events")
async def admin_events(request: Request) -> StreamingResponse:
    """관리자 화면용 SSE 스트림 — monitor(1초)·services(5초/작업중 2초) 이벤트."""
    admin._localhost_only(request)
    return StreamingResponse(
        event_stream(_broadcaster),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
