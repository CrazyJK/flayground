"""연출 클립 잡 모델 — 잡 디렉토리 + status.json(단일 진실 소스).

stabilizer/enhancer 와 동일 패턴: 잡당 status.json 을 디스크에 원자적으로 기록해
API 재시작 후에도 폴링·결과를 복구한다. 체인 고유 필드로 서브 잡 id
(stab_job/enh_job)를 status 에 남겨 취소·재개 시 추적한다.

레이아웃: {work_dir}/{job_id}/  ── in.mp4, trim.mp4, out.mp4, status.json
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

from .config import showcase_config


def _work_root() -> Path:
    p = repo_path(showcase_config()["work_dir"])
    p.mkdir(parents=True, exist_ok=True)
    return p


def job_path(job_id: str) -> Path:
    """잡 디렉토리 경로."""
    return _work_root() / job_id


def status_path(job_id: str) -> Path:
    """status.json 경로."""
    return job_path(job_id) / "status.json"


def input_path(job_id: str) -> Path:
    """업로드 원본 저장 경로."""
    return job_path(job_id) / "in.mp4"


def _write(job_id: str, st: dict[str, Any]) -> None:
    sp = status_path(job_id)
    sp.parent.mkdir(parents=True, exist_ok=True)
    tmp = sp.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(st, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, sp)  # 원자적 교체


def new_job(params: dict[str, Any]) -> str:
    """새 잡 생성(queued). params 는 구간(start/end)+안정화·화질 옵션 dict.

    Returns:
        16자리 hex 잡 id.
    """
    job_id = uuid.uuid4().hex[:16]
    job_path(job_id).mkdir(parents=True, exist_ok=True)
    now = time.time()
    _write(job_id, {
        "job_id": job_id, "status": "queued", "params": params,
        "stage": None, "progress": 0, "sub": None,
        "stab_job": None, "enh_job": None,
        "created_at": now, "updated_at": now,
        "input": None, "outputs": [], "error": None, "note": None,
    })
    return job_id


def get_status(job_id: str) -> dict[str, Any] | None:
    """status.json 읽기. 없거나 깨졌으면 None."""
    sp = status_path(job_id)
    if not sp.exists():
        return None
    try:
        return json.loads(sp.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def set_status(job_id: str, **updates: Any) -> dict[str, Any] | None:
    """status 부분 갱신(updated_at 자동). 잡이 없으면 None."""
    st = get_status(job_id)
    if st is None:
        return None
    st.update(updates)
    st["updated_at"] = time.time()
    _write(job_id, st)
    return st


def list_jobs() -> list[dict[str, Any]]:
    """전체 잡 status 목록(최신순)."""
    root = _work_root()
    out: list[dict[str, Any]] = []
    for d in root.iterdir():
        if d.is_dir() and (d / "status.json").exists():
            st = get_status(d.name)
            if st:
                out.append(st)
    out.sort(key=lambda s: s.get("created_at", 0), reverse=True)
    return out


def result_name(st: dict[str, Any]) -> str:
    """결과 다운로드 파일명 — 활성 단계와 설정을 이름에 명시(ASCII 안전).

    예: showcase_2.4-7.2s_person-dejitter_4k_0.5x_60fps_region_827a70.mp4
        showcase_0-8s_background-auto_noenh_abc123.mp4
    """
    p = st.get("params") or {}
    parts = [f"{float(p.get('start', 0)):g}-{float(p.get('end', 0)):g}s"]
    stab = p.get("stabilize") or p.get("mode") or "person"
    if stab == "off":
        parts.append("nostab")
    else:
        parts.append(f"{stab}-{p.get('strength', 'smooth')}")
    enh = p.get("enhance", True)
    if isinstance(enh, str):
        enh = enh.lower() not in ("0", "false", "off", "no")
    if not enh:
        parts.append("noenh")
    else:
        up = p.get("upscale")
        if up and up != "none":
            parts.append(str(up))
        sp = float(p.get("speed", 1) or 1)
        if sp != 1:
            parts.append(f"{sp:g}x")
        if int(p.get("fps") or 0) == 60:
            parts.append("60fps")
        if p.get("interpolate") == "off":
            parts.append("nointerp")
    if p.get("region"):
        parts.append("region")
    if p.get("mute"):
        parts.append("mute")
    return "showcase_" + "_".join(parts) + f"_{st.get('job_id', '')[:6]}.mp4"


def cleanup_old_jobs(retain_hours: float | None = None) -> int:
    """보존기간 지난 완료/실패/취소 잡 디렉토리를 삭제. 삭제 개수 반환.

    진행 중(queued/running)은 나이와 무관하게 보존. best-effort.
    """
    if retain_hours is None:
        retain_hours = float(showcase_config().get("retain_hours", 72) or 0)
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
