"""영상 화질 개선 API 라우터 — 업로드 → 비동기 잡 → 폴링 → 결과 다운로드.

설계: docs/video-enhance-plan.md. stabilize 라우터 준용 — localhost-only,
잡은 서브프로세스(packages.enhancer.cli)로 실행하고 status.json 으로 추적한다.
GPU 상호배제(안정화·인덱싱과 동시 1잡)는 routers/_gpu.gpu_busy 공용.

엔드포인트(prefix=/api/enhance):
  POST /jobs                  업로드 + 옵션 -> 잡 생성(길이 즉시 검증)
  GET  /jobs                  잡 목록
  GET  /jobs/{id}             잡 상태(폴링)
  GET  /jobs/{id}/result      결과 mp4 (?variant=original 은 원본)
  POST /jobs/{id}/cancel      취소(프로세스 트리 종료)
  POST /jobs/{id}/retry       실패/취소 잡 재개(증분이라 이어서)
  DELETE /jobs/{id}           잡 삭제
"""

from __future__ import annotations

import asyncio
import logging
import shutil
import subprocess
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from apps.api.routers._gpu import gpu_busy, kill_tree
from packages.enhancer import job as J
from packages.enhancer.config import enhance_config
from packages.enhancer.plan import INTERP_MODES, SPEEDS, UPSCALE_MODES
from packages.settings import REPO_ROOT

router = APIRouter(prefix="/api/enhance", tags=["enhance"])
log = logging.getLogger(__name__)

# 실행 중 워커 서브프로세스 (취소/삭제용 — JSON 직렬화 대상 아님)
_procs: dict[str, subprocess.Popen] = {}


def _localhost_only(request: Request) -> None:
    client_host = request.client.host if request.client else ""
    if client_host not in ("127.0.0.1", "localhost", "::1", "ai.kamoru.jk"):
        raise HTTPException(403, "enhance endpoints are localhost-only")


def _wait(job_id: str, proc: subprocess.Popen) -> None:
    proc.wait()
    _procs.pop(job_id, None)
    st = J.get_status(job_id)
    if st and st.get("status") == "running":
        J.set_status(job_id, status="failed",
                     error=f"워커 비정상 종료(exit {proc.returncode})")


def _spawn_worker(job_id: str) -> None:
    venv_python = str(REPO_ROOT / ".venv" / "Scripts" / "python.exe")
    proc = subprocess.Popen(
        [venv_python, "-m", "packages.enhancer.cli", "run", job_id],
        cwd=str(REPO_ROOT),
    )
    _procs[job_id] = proc
    asyncio.get_event_loop().run_in_executor(None, _wait, job_id, proc)


def _quick_duration(path: str) -> float:
    """업로드 직후 길이 검증용 ffprobe (동기·수백 ms)."""
    cfg = enhance_config()
    p = subprocess.run(
        [cfg["ffprobe"], "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path],
        capture_output=True, text=True)
    try:
        return float((p.stdout or "0").strip() or 0)
    except ValueError:
        return 0.0


@router.post("/jobs")
async def create_job(
    request: Request,
    file: UploadFile = File(...),
    upscale: str = Form("4k"),        # none | 2x | 4k
    speed: str = Form("0.5"),         # 1 | 0.5 | 0.25
    interpolate: str = Form("smooth"),  # off | smooth
    model: str = Form("photo"),       # photo | anime
) -> dict[str, Any]:
    _localhost_only(request)
    if upscale not in UPSCALE_MODES:
        raise HTTPException(400, "upscale 은 none | 2x | 4k")
    try:
        speed_f = float(speed)
    except ValueError:
        raise HTTPException(400, "speed 는 1 | 0.5 | 0.25") from None
    if speed_f not in SPEEDS:
        raise HTTPException(400, "speed 는 1 | 0.5 | 0.25")
    if interpolate not in INTERP_MODES:
        raise HTTPException(400, "interpolate 는 off | smooth")
    cfg = enhance_config()
    if model not in cfg["esrgan_models"]:
        raise HTTPException(400, f"model 은 {' | '.join(cfg['esrgan_models'])}")
    busy = gpu_busy()
    if busy:
        raise HTTPException(409, busy)

    # 보존기간 지난 잡 정리(기회적 — 새 잡 받을 때마다)
    try:
        J.cleanup_old_jobs()
    except Exception:  # noqa: BLE001 — 정리 실패가 잡 생성을 막지 않게
        pass

    params = {"upscale": upscale, "speed": speed_f,
              "interpolate": interpolate, "model": model}
    job_id = J.new_job(params)
    dest = J.input_path(job_id)
    try:
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    finally:
        await file.close()

    # 길이 제한을 업로드 직후 동기 검증 — 긴 영상을 잡 시작 전에 돌려보낸다(§7)
    maxs = float(cfg.get("max_input_seconds", 0) or 0)
    dur = _quick_duration(str(dest))
    if dur <= 0:
        shutil.rmtree(J.job_path(job_id), ignore_errors=True)
        raise HTTPException(400, "영상 정보를 읽을 수 없습니다(지원하지 않는 파일?)")
    if maxs and dur > maxs:
        shutil.rmtree(J.job_path(job_id), ignore_errors=True)
        raise HTTPException(
            400, f"입력이 너무 깁니다({dur:.0f}초 > 제한 {maxs:.0f}초) — "
                 "업스케일 비용이 프레임당 초 단위라 짧은 영상만 받습니다")

    _spawn_worker(job_id)
    return {"job_id": job_id, "status": "queued", "params": params}


@router.get("/jobs")
def list_jobs(request: Request) -> dict[str, Any]:
    _localhost_only(request)
    return {"jobs": J.list_jobs()}


@router.get("/jobs/{job_id}")
def job_status(job_id: str, request: Request) -> dict[str, Any]:
    _localhost_only(request)
    st = J.get_status(job_id)
    if not st:
        raise HTTPException(404, "job not found")
    return st


@router.api_route("/jobs/{job_id}/result", methods=["GET", "HEAD"])
def job_result(job_id: str, request: Request, variant: str | None = None) -> FileResponse:
    _localhost_only(request)
    st = J.get_status(job_id)
    if not st:
        raise HTTPException(404, "job not found")
    # 원본 — 전후 비교용(업로드 파일 그대로. gif 는 image/gif 로)
    if variant == "original":
        src = J.input_path(job_id)
        if not src.exists():
            raise HTTPException(409, "원본 없음")
        fmt = (st.get("input") or {}).get("format") or ""
        media = "image/gif" if "gif" in fmt else "video/mp4"
        return FileResponse(str(src), media_type=media, filename=f"original_{job_id}")
    if st.get("status") != "done":
        raise HTTPException(409, "아직 결과가 준비되지 않았습니다")
    out = J.job_path(job_id) / "out.mp4"
    if not out.exists():
        raise HTTPException(409, "결과 파일 없음")
    return FileResponse(str(out), media_type="video/mp4", filename=f"enhanced_{job_id}.mp4")


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, request: Request) -> dict[str, Any]:
    _localhost_only(request)
    if not J.get_status(job_id):
        raise HTTPException(404, "job not found")
    p = _procs.get(job_id)
    if p:
        kill_tree(p)
    J.set_status(job_id, status="canceled")
    return {"status": "canceled", "job_id": job_id}


@router.post("/jobs/{job_id}/retry")
def retry_job(job_id: str, request: Request) -> dict[str, Any]:
    """실패/취소 잡 재개 — 단계가 증분·멱등이라 멈춘 지점부터 이어간다."""
    _localhost_only(request)
    st = J.get_status(job_id)
    if not st:
        raise HTTPException(404, "job not found")
    if st.get("status") not in ("failed", "canceled"):
        raise HTTPException(409, "실패/취소된 잡만 재개할 수 있습니다")
    if not J.input_path(job_id).exists():
        raise HTTPException(409, "원본이 없어 재개할 수 없습니다")
    busy = gpu_busy()
    if busy:
        raise HTTPException(409, busy)
    J.set_status(job_id, status="queued", error=None)
    _spawn_worker(job_id)
    return {"job_id": job_id, "status": "queued"}


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, request: Request) -> dict[str, Any]:
    _localhost_only(request)
    p = _procs.get(job_id)
    if p:
        kill_tree(p)
    _procs.pop(job_id, None)
    d = J.job_path(job_id)
    if d.exists():
        shutil.rmtree(d, ignore_errors=True)
    return {"status": "deleted", "job_id": job_id}
