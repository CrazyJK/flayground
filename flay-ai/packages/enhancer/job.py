"""화질 개선 잡 모델 — 잡 디렉토리 + status.json(단일 진실 소스).

packages/stabilizer/job.py 패턴의 최소 복제(잡 파라미터 스키마가 달라 params dict 로 통일).
후속: 두 서브시스템 공용 잡 저장소로 승격(docs/video-enhance-plan.md 남은 할 일).

레이아웃: {work_dir}/{job_id}/ ── in.mp4, frames_*/, logs/, out.mp4, status.json
"""

from __future__ import annotations

import json
import os
import shutil
import time
import uuid
from pathlib import Path
from typing import Any

from packages.settings import repo_path

from .config import enhance_config


def _work_root() -> Path:
    p = repo_path(enhance_config()["work_dir"])
    p.mkdir(parents=True, exist_ok=True)
    return p


def job_path(job_id: str) -> Path:
    return _work_root() / job_id


def status_path(job_id: str) -> Path:
    return job_path(job_id) / "status.json"


def input_path(job_id: str) -> Path:
    # 확장자와 무관하게 고정 이름(ffmpeg 는 내용으로 포맷 감지) — stabilizer 와 동일
    return job_path(job_id) / "in.mp4"


def _write(job_id: str, st: dict[str, Any]) -> None:
    sp = status_path(job_id)
    sp.parent.mkdir(parents=True, exist_ok=True)
    tmp = sp.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(st, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, sp)  # 원자적 교체


def new_job(params: dict[str, Any]) -> str:
    job_id = uuid.uuid4().hex[:16]
    job_path(job_id).mkdir(parents=True, exist_ok=True)
    now = time.time()
    _write(job_id, {
        "job_id": job_id, "status": "queued", "params": params,
        "stage": None, "progress": 0,
        "created_at": now, "updated_at": now,
        "input": None, "plan": None, "outputs": [], "error": None, "note": None,
    })
    return job_id


def get_status(job_id: str) -> dict[str, Any] | None:
    sp = status_path(job_id)
    if not sp.exists():
        return None
    try:
        return json.loads(sp.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def set_status(job_id: str, **updates: Any) -> dict[str, Any] | None:
    st = get_status(job_id)
    if st is None:
        return None
    st.update(updates)
    st["updated_at"] = time.time()
    _write(job_id, st)
    return st


def list_jobs() -> list[dict[str, Any]]:
    root = _work_root()
    out: list[dict[str, Any]] = []
    for d in root.iterdir():
        if d.is_dir() and (d / "status.json").exists():
            st = get_status(d.name)
            if st:
                out.append(st)
    out.sort(key=lambda s: s.get("created_at", 0), reverse=True)
    return out


def cleanup_old_jobs(retain_hours: float | None = None) -> int:
    """보존기간 지난 완료/실패/취소 잡 디렉토리 삭제. 삭제 개수 반환.

    - status.json 없는 디렉토리/파일은 건드리지 않는다.
    - 진행 중(queued/running)은 나이와 무관하게 보존.
    best-effort — 디렉토리 잠김 등은 무시.
    """
    if retain_hours is None:
        retain_hours = float(enhance_config().get("retain_hours", 72) or 0)
    if retain_hours <= 0:
        return 0
    cutoff = time.time() - retain_hours * 3600
    removed = 0
    for d in _work_root().iterdir():
        if not d.is_dir():
            continue
        st = get_status(d.name)
        if st is None or st.get("status") not in ("done", "failed", "canceled"):
            continue
        if st.get("updated_at", 0) < cutoff:
            shutil.rmtree(d, ignore_errors=True)
            removed += 1
    return removed
