"""연출 클립(영상 스튜디오) API 라우터 — 업로드+구간 → 비동기 체인 잡 → 폴링 → 결과 다운로드.

enhance 라우터 준용 — localhost-only, 잡은 서브프로세스(packages.showcase.cli)로
실행하고 status.json 으로 추적한다. 체인 고유 사항: 취소/삭제/워커 비정상 종료 시
서브 잡(stab_job/enh_job)이 running 으로 남으면 gpu_busy 가 영구 잠기므로 함께 정리한다.

단계는 선택 가능(stabilize=off|background|person, enhance=on|off, 전체 구간이면 트림 생략).
구간 상한은 화질 단계가 켜졌을 때 showcase.max_clip_seconds, 꺼졌을 때 stabilize.max_input_seconds.

엔드포인트(prefix=/api/showcase):
  POST /jobs                  업로드 + 구간/옵션 -> 잡 생성(구간 즉시 검증)
  GET  /jobs                  잡 목록
  GET  /jobs/{id}             잡 상태(폴링)
  GET  /jobs/{id}/events      잡 상태 SSE 스트림
  GET  /jobs/{id}/result      결과 mp4 (?variant=original 은 업로드 원본)
  POST /jobs/{id}/cancel      취소(프로세스 트리 종료 + 서브 잡 정리)
  POST /jobs/{id}/retry       실패/취소 잡 재개(완료 서브 잡은 건너뜀)
  DELETE /jobs/{id}           잡 삭제
"""

from __future__ import annotations

import asyncio
import json
import logging
import shutil
import subprocess
import time
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from apps.api.routers._gpu import gpu_busy, kill_tree
from apps.api.sse import SSE_HEADERS, poll_stream
from packages.enhancer import job as EJ
from packages.enhancer.plan import INTERP_MODES, SPEEDS, UPSCALE_MODES
from packages.settings import REPO_ROOT
from packages.showcase import job as J
from packages.showcase.config import showcase_config
from packages.showcase.pipeline import STABILIZE_MODES, plan_stages
from packages.stabilizer import job as SJ
from packages.stabilizer.config import stabilize_config

router = APIRouter(prefix="/api/showcase", tags=["showcase"])
log = logging.getLogger(__name__)

# 실행 중 워커 서브프로세스 (취소/삭제용 — JSON 직렬화 대상 아님)
_procs: dict[str, subprocess.Popen] = {}

_FALSY = ("0", "false", "off", "no", "")


def _flag(v: str | None) -> bool:
    """폼 불리언 — "1"/"true"/"on" 등은 참, None/"0"/"false"/"off" 는 거짓."""
    return v is not None and v.strip().lower() not in _FALSY


def _localhost_only(request: Request) -> None:
    client_host = request.client.host if request.client else ""
    if client_host not in ("127.0.0.1", "localhost", "::1", "ai.kamoru.jk"):
        raise HTTPException(403, "showcase endpoints are localhost-only")


def _cancel_subjobs(job_id: str) -> None:
    """실행 중이던 서브 잡을 canceled 로 마킹 — running 잔류 시 gpu_busy 영구 잠김 방지."""
    st = J.get_status(job_id) or {}
    sid, eid = st.get("stab_job"), st.get("enh_job")
    if sid:
        sub = SJ.get_status(sid)
        if sub and sub.get("status") in ("queued", "running"):
            SJ.set_status(sid, status="canceled")
    if eid:
        sub = EJ.get_status(eid)
        if sub and sub.get("status") in ("queued", "running"):
            EJ.set_status(eid, status="canceled")


def _wait(job_id: str, proc: subprocess.Popen) -> None:
    proc.wait()
    _procs.pop(job_id, None)
    st = J.get_status(job_id)
    if st and st.get("status") == "running":
        J.set_status(job_id, status="failed",
                     error=f"워커 비정상 종료(exit {proc.returncode})")
        _cancel_subjobs(job_id)


def _spawn_worker(job_id: str) -> None:
    venv_python = str(REPO_ROOT / ".venv" / "Scripts" / "python.exe")
    proc = subprocess.Popen(
        [venv_python, "-m", "packages.showcase.cli", "run", job_id],
        cwd=str(REPO_ROOT),
    )
    _procs[job_id] = proc
    asyncio.get_event_loop().run_in_executor(None, _wait, job_id, proc)


def _quick_duration(path: str) -> float:
    """업로드 직후 구간 검증용 ffprobe (동기·수백 ms)."""
    cfg = showcase_config()
    p = subprocess.run(
        [cfg["ffprobe"], "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path],
        capture_output=True, text=True)
    try:
        return float((p.stdout or "0").strip() or 0)
    except ValueError:
        return 0.0


def _parse_json(raw: str | None, what: str, keys: tuple[str, ...]) -> dict[str, Any] | None:
    if not raw:
        return None
    try:
        v = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(400, f"{what} 은(는) {{{','.join(keys)}}} JSON") from None
    if not isinstance(v, dict):
        raise HTTPException(400, f"{what} 은(는) JSON 객체여야 합니다")
    return v


@router.post("/jobs")
async def create_job(
    request: Request,
    file: UploadFile = File(...),
    start: float = Form(0),           # 추출 구간 시작(초, 원본 기준). 0~끝이면 트림 생략
    end: float = Form(0),             # 추출 구간 끝(초). 0=영상 끝
    subject: str | None = Form(None),  # 주인공 클릭 {"t","x","y"} JSON (원본 기준 t)
    region: str | None = Form(None),   # 처리 구역 {"x","y","w","h"} JSON (0~1 상대 사각형)
    stabilize: str = Form("person"),  # off | background | person
    strength: str = Form("smooth"),   # dejitter | smooth | lock | auto | pin(person 전용 중앙 고정)
    edge: str = Form("crop"),         # crop | blur | black
    scale_lock: str | None = Form(None),  # 인물 모드 — 주인공 크기까지 고정
    lowfps: str | None = Form(None),  # 저fps(gif) 입력 보간(안정화 단계)
    enhance: str = Form("1"),         # 화질 개선 단계 on/off
    upscale: str = Form("4k"),        # none | 2x | 4k
    speed: str = Form("0.5"),         # 1 | 0.5 | 0.25
    interpolate: str = Form("smooth"),  # off | smooth
    model: str = Form("photo"),       # photo | anime
    fps: str = Form("keep"),          # keep | 60
    mute: str | None = Form(None),    # 결과 오디오 제거(무음 출력)
) -> dict[str, Any]:
    _localhost_only(request)
    if stabilize not in STABILIZE_MODES:
        raise HTTPException(400, "stabilize 는 off | background | person")
    if strength not in ("dejitter", "smooth", "lock", "auto", "pin"):
        raise HTTPException(400, "strength 는 dejitter | smooth | lock | auto | pin")
    if strength == "pin" and stabilize != "person":
        raise HTTPException(400, "pin(중앙 고정)은 stabilize=person 에서만 쓸 수 있습니다")
    if edge not in ("crop", "blur", "black"):
        raise HTTPException(400, "edge 는 crop | blur | black")
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
    if model not in ("photo", "anime"):
        raise HTTPException(400, "model 은 photo | anime")
    if fps not in ("keep", "60"):
        raise HTTPException(400, "fps 는 keep | 60")
    subj = _parse_json(subject, "subject", ("t", "x", "y"))
    regn = _parse_json(region, "region", ("x", "y", "w", "h"))
    if regn:
        try:
            if float(regn.get("w", 0)) <= 0 or float(regn.get("h", 0)) <= 0:
                raise HTTPException(400, "region 의 w/h 는 0 보다 커야 합니다")
        except (TypeError, ValueError):
            raise HTTPException(400, "region 좌표는 숫자여야 합니다") from None
    if start < 0 or (end > 0 and end <= start):
        raise HTTPException(400, "구간이 잘못되었습니다(start < end 여야 합니다)")
    enh = _flag(enhance)
    busy = gpu_busy()
    if busy:
        raise HTTPException(409, busy)

    # 보존기간 지난 잡 정리(기회적 — 새 잡 받을 때마다)
    try:
        J.cleanup_old_jobs()
    except Exception:  # noqa: BLE001 — 정리 실패가 잡 생성을 막지 않게
        pass

    params: dict[str, Any] = {
        "start": start, "end": end,
        "stabilize": stabilize, "strength": strength, "edge": edge,
        "scale_lock": _flag(scale_lock), "lowfps": _flag(lowfps),
        "enhance": enh, "upscale": upscale, "speed": speed_f,
        "interpolate": interpolate, "model": model, "fps": 60 if fps == "60" else 0,
        "mute": _flag(mute),
    }
    if subj:
        params["subject"] = subj
    if regn:
        params["region"] = regn
    job_id = J.new_job(params)
    dest = J.input_path(job_id)
    try:
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    finally:
        await file.close()

    # 업로드 직후 동기 검증 — 구간·활성 단계·길이 상한
    dur = _quick_duration(str(dest))
    if dur <= 0:
        shutil.rmtree(J.job_path(job_id), ignore_errors=True)
        raise HTTPException(400, "영상 정보를 읽을 수 없습니다(지원하지 않는 파일?)")
    if start >= dur:
        shutil.rmtree(J.job_path(job_id), ignore_errors=True)
        raise HTTPException(400, f"시작 지점({start:.1f}초)이 영상 길이({dur:.1f}초)를 벗어납니다")
    stages = plan_stages(params, dur)
    if not stages:
        shutil.rmtree(J.job_path(job_id), ignore_errors=True)
        raise HTTPException(400, "실행할 단계가 없습니다 — 구간·구역·안정화·화질 중 하나는 지정하세요")
    clip = (end if end > 0 else dur) - start
    if enh:
        maxs = float(showcase_config().get("max_clip_seconds", 0) or 0)
        why = "업스케일 비용이 프레임당 초 단위라 짧은 구간만 받습니다"
    else:
        maxs = float(stabilize_config().get("max_input_seconds", 0) or 0)
        why = "안정화 처리 상한"
    if maxs and clip > maxs:
        shutil.rmtree(J.job_path(job_id), ignore_errors=True)
        raise HTTPException(400, f"구간이 너무 깁니다({clip:.1f}초 > 제한 {maxs:.0f}초) — {why}")

    _spawn_worker(job_id)
    return {"job_id": job_id, "status": "queued", "params": params, "stages": list(stages)}


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


_TERMINAL_STATUSES = {"done", "failed", "canceled"}


@router.get("/jobs/{job_id}/events")
async def job_events(job_id: str, request: Request) -> StreamingResponse:
    """잡 상태 SSE 스트림 — 변화 시만 push, 종료 상태 push 후 스트림 종료."""
    _localhost_only(request)
    if not J.get_status(job_id):
        raise HTTPException(404, "job not found")
    return StreamingResponse(
        poll_stream(
            lambda: asyncio.to_thread(J.get_status, job_id),
            lambda st: {"type": "status", "ts": time.time(), "job": st},
            interval=1.0,
            is_terminal=lambda st: st.get("status") in _TERMINAL_STATUSES,
        ),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.api_route("/jobs/{job_id}/result", methods=["GET", "HEAD"])
def job_result(job_id: str, request: Request, variant: str | None = None) -> FileResponse:
    _localhost_only(request)
    st = J.get_status(job_id)
    if not st:
        raise HTTPException(404, "job not found")
    # 원본 — 전후 비교용(업로드 파일 그대로)
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
    return FileResponse(str(out), media_type="video/mp4", filename=J.result_name(st))


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, request: Request) -> dict[str, Any]:
    _localhost_only(request)
    if not J.get_status(job_id):
        raise HTTPException(404, "job not found")
    p = _procs.get(job_id)
    if p:
        kill_tree(p)  # 워커가 띄운 서브 잡 워커·ffmpeg/ncnn 자식까지 종료
    J.set_status(job_id, status="canceled")
    _cancel_subjobs(job_id)
    return {"status": "canceled", "job_id": job_id}


@router.post("/jobs/{job_id}/retry")
def retry_job(job_id: str, request: Request) -> dict[str, Any]:
    """실패/취소 잡 재개 — 완료된 서브 잡은 건너뛰고 이어간다."""
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
    _cancel_subjobs(job_id)
    d = J.job_path(job_id)
    if d.exists():
        shutil.rmtree(d, ignore_errors=True)
    return {"status": "deleted", "job_id": job_id}
