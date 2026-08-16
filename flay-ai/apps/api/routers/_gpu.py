"""GPU 상호배제 공용 — 안정화·화질개선·인덱싱 잡의 동시 실행 방지.

단일 GPU(RTX 4070 Ti 12GB)를 CUDA(인덱서·안정화)와 Vulkan(화질개선 ncnn)이 나눠 쓰므로
무거운 잡은 동시 1개만 허용한다. 배제 실패는 OOM 이 아니라 속도 저하로 나타나
감지가 어렵다(docs/flay-ai/video-enhance-plan.md §7) — 잡 시작 전에 여기서 막는 게 전부다.
"""

from __future__ import annotations

import subprocess


def gpu_busy() -> str | None:
    """실행 중인 GPU 잡이 있으면 사유 문자열, 없으면 None."""
    try:
        from packages.stabilizer import job as SJ

        for s in SJ.list_jobs():
            if s.get("status") == "running":
                return f"영상 안정화 잡 {s['job_id']} 실행 중 — 완료 후 시도하세요."
    except Exception:  # noqa: BLE001 — 한 서브시스템 오류가 검사 전체를 막지 않게
        pass
    try:
        from packages.enhancer import job as EJ

        for s in EJ.list_jobs():
            if s.get("status") == "running":
                return f"화질 개선 잡 {s['job_id']} 실행 중 — 완료 후 시도하세요."
    except Exception:  # noqa: BLE001
        pass
    try:
        from apps.api.routers.admin import PIPELINE_DEFS, _running_jobs

        for pj in PIPELINE_DEFS:
            info = _running_jobs.get(pj)
            if info and info.get("status") == "running":
                return f"인덱싱 '{pj}' 파이프라인 실행 중 — 완료 후 시도하세요."
    except Exception:  # noqa: BLE001 — admin 미가용이어도 진행
        pass
    return None


def kill_tree(proc: subprocess.Popen) -> None:
    """워커 프로세스 트리 종료 — 워커가 띄운 ncnn/ffmpeg 자식까지(taskkill /T).

    Popen.terminate() 는 직계만 죽여 GPU 를 쥔 자식이 고아로 남는다(Windows).
    """
    if proc.poll() is None:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                       capture_output=True)
