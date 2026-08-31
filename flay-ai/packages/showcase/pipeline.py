"""연출 클립 잡 파이프라인 — trim → stabilize(서브 잡) → enhance(서브 잡) → finalize.

기존 stabilizer·enhancer 를 수정 없이 재사용한다: 각각의 잡을 생성해 별도
프로세스(python -m packages.<pkg>.cli run)로 순차 실행하고 status.json 을 폴링해
진행률을 하나로 매핑한다. 별도 프로세스로 돌리는 이유는 stabilizer 설계와 동일 —
CUDA(YOLO)·Vulkan(ncnn) 자원이 단계 사이에 완전히 해제되게 한다(12GB GPU 공유).

재개(retry): 서브 잡 id 를 status(stab_job/enh_job)에 남겨 두므로, 완료된 서브 잡은
건너뛰고 실패한 서브 잡은 같은 id 로 재실행한다(enhancer 는 단계 증분·멱등).
"""

from __future__ import annotations

import logging
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any

from packages.enhancer import job as EJ
from packages.enhancer.pipeline import probe_input
from packages.settings import REPO_ROOT
from packages.stabilizer import job as SJ

from . import job as J
from .config import showcase_config

log = logging.getLogger(__name__)

_POLL_SEC = 2.0

# 전체 진행률에서 각 단계가 차지하는 구간 — enhance(업스케일)가 지배 비용
_STAGES = {"trim": (0, 5), "stabilize": (5, 25), "enhance": (25, 99)}


def _venv_python() -> str:
    return str(REPO_ROOT / ".venv" / "Scripts" / "python.exe")


def _run_sub(module: str, jobmod: Any, sub_id: str, stage: str,
             set_status: Any) -> dict[str, Any]:
    """서브 잡을 별도 프로세스로 실행하고 완료까지 폴링. done 이 아니면 예외.

    Args:
        module: 워커 모듈 경로(예: "packages.stabilizer.cli").
        jobmod: 해당 패키지의 job 모듈(get_status 사용).
        sub_id: 서브 잡 id.
        stage: showcase 단계명(진행률 구간 키).
        set_status: showcase status 갱신 콜백.

    Returns:
        완료된 서브 잡의 status dict.
    """
    lo, hi = _STAGES[stage]
    proc = subprocess.Popen([_venv_python(), "-m", module, "run", sub_id],
                            cwd=str(REPO_ROOT))
    while proc.poll() is None:
        sub = jobmod.get_status(sub_id) or {}
        pct = int(sub.get("progress") or 0)
        set_status(stage=stage, progress=lo + int((hi - lo) * pct / 100),
                   sub={"kind": stage, "job_id": sub_id,
                        "stage": sub.get("stage"), "progress": pct,
                        "plan": sub.get("plan")})
        time.sleep(_POLL_SEC)
    sub = jobmod.get_status(sub_id) or {}
    if sub.get("status") != "done":
        raise RuntimeError(
            f"{stage} 서브 잡 실패({sub.get('status')}): {sub.get('error') or '원인 미상'}")
    set_status(progress=hi, sub=None)
    return sub


def _region_crop(region: dict[str, Any], fw: int, fh: int) -> str:
    """구역(0~1 상대 사각형) → ffmpeg crop 필터 문자열. 짝수·경계 보정.

    Args:
        region: {"x","y","w","h"} 표시 프레임 기준 상대 좌표(0~1).
        fw, fh: 회전 반영 표시 프레임 크기(px).

    Returns:
        "crop=w:h:x:y" 필터 문자열.
    """
    x = min(max(float(region.get("x", 0)), 0.0), 1.0)
    y = min(max(float(region.get("y", 0)), 0.0), 1.0)
    w = min(max(float(region.get("w", 1)), 0.0), 1.0 - x)
    h = min(max(float(region.get("h", 1)), 0.0), 1.0 - y)
    cw = max((round(w * fw) // 2) * 2, 240)  # 최소 240px — 과도한 초소형 크롭 방지
    ch = max((round(h * fh) // 2) * 2, 240)
    cx = min((round(x * fw) // 2) * 2, max(fw - cw, 0))
    cy = min((round(y * fh) // 2) * 2, max(fh - ch, 0))
    return f"crop={cw}:{ch}:{cx}:{cy}"


def _trim(cfg: dict, inp: Path, out: Path, start: float, dur: float,
          has_audio: bool, crop: str | None = None) -> None:
    """구간 트림 — 프레임 정밀 컷(재인코딩, CRF 12 시각적 무손실). 있으면 재사용.

    crop 이 있으면 원본 해상도에서 지정 구역만 잘라낸다(피사체 확대 — 이후
    안정화 다운스케일을 피하고 원본 픽셀 밀도로 업스케일하기 위함).
    """
    if out.exists() and out.stat().st_size > 0:
        return
    cmd = [cfg["ffmpeg"], "-hide_banner", "-v", "error", "-y",
           "-ss", f"{start:.3f}", "-i", str(inp), "-t", f"{dur:.3f}",
           "-map", "0:v:0"]
    if crop:
        cmd += ["-vf", crop]
    cmd += ["-c:v", "libx264", "-crf", str(cfg.get("trim_crf", 12)),
            "-preset", "medium", "-pix_fmt", "yuv420p"]
    if has_audio:
        cmd += ["-map", "0:a:0?", "-c:a", "aac", "-b:a", "192k"]
    cmd += [str(out)]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0 or not out.exists() or out.stat().st_size == 0:
        raise RuntimeError(f"구간 트림 실패: {(p.stderr or '')[-500:]}")


def run_job(job_id: str) -> None:
    """showcase 잡 실행 — cli(서브프로세스)가 호출. 실패는 status 에 남긴다."""
    st = J.get_status(job_id)
    if st is None:
        raise SystemExit(f"job not found: {job_id}")
    cfg = showcase_config()
    J.set_status(job_id, status="running", stage="trim", progress=0, error=None)

    def _set(**kw: Any) -> None:
        J.set_status(job_id, **kw)

    try:
        params = st.get("params") or {}
        jdir = J.job_path(job_id)
        inp = J.input_path(job_id)

        # ── probe + 구간 검증
        meta = probe_input(cfg["ffprobe"], inp)
        if meta["duration"] <= 0:
            raise RuntimeError("영상 정보를 읽을 수 없습니다(지원하지 않는 파일?)")
        start = float(params.get("start", 0) or 0)
        end = float(params.get("end", 0) or 0)
        if end <= 0 or end > meta["duration"] + 0.05:
            end = meta["duration"]
        dur = end - start
        if start < 0 or dur <= 0:
            raise RuntimeError(f"구간이 잘못되었습니다: {start:.1f}~{end:.1f}초")
        maxs = float(cfg.get("max_clip_seconds", 0) or 0)
        if maxs and dur > maxs:
            raise RuntimeError(
                f"구간이 너무 깁니다({dur:.1f}초 > 제한 {maxs:.0f}초) — "
                "업스케일 비용이 프레임당 초 단위라 짧은 구간만 받습니다")
        _set(input=meta)

        # ── ① trim (+ 구역 크롭 — 지정 시 원본 해상도에서 해당 사각형만 잘라냄)
        region = params.get("region")
        crop = _region_crop(region, meta["width"], meta["height"]) if region else None
        trim_mp4 = jdir / "trim.mp4"
        _set(stage="trim", progress=1)
        _trim(cfg, inp, trim_mp4, start, dur, bool(meta.get("has_audio")), crop)
        _set(progress=_STAGES["trim"][1])

        # ── ② stabilize (person 모드 — 피사체 추적 고정 + 여백 크롭)
        sid = st.get("stab_job")
        stab = SJ.get_status(sid) if sid else None
        if not stab or stab.get("status") != "done":
            if not stab:  # 새 서브 잡 — 클릭 좌표는 트림(시간)·구역(공간) 기준으로 변환해 전달
                options: dict[str, Any] = {"edge": params.get("edge", "crop")}
                subject = params.get("subject")
                if subject:
                    t = min(max(float(subject.get("t", 0)) - start, 0.0), dur)
                    sx, sy = float(subject.get("x", 0.5)), float(subject.get("y", 0.5))
                    if region:  # 원본 기준 클릭 → 크롭된 프레임 기준 상대좌표
                        rw = max(float(region.get("w", 1)), 1e-6)
                        rh = max(float(region.get("h", 1)), 1e-6)
                        sx = min(max((sx - float(region.get("x", 0))) / rw, 0.0), 1.0)
                        sy = min(max((sy - float(region.get("y", 0))) / rh, 0.0), 1.0)
                    options["subject"] = {"t": round(t, 3),
                                          "x": round(sx, 4), "y": round(sy, 4)}
                if params.get("scale_lock"):
                    options["scale_lock"] = True
                sid = SJ.new_job(params.get("mode", "person"),
                                 params.get("strength", "smooth"), options)
                _set(stab_job=sid)
            if not SJ.input_path(sid).exists():
                shutil.copy2(trim_mp4, SJ.input_path(sid))
            stab = _run_sub("packages.stabilizer.cli", SJ, sid, "stabilize", _set)
        stab_out = SJ.job_path(sid) / ((stab.get("outputs") or [{}])[0].get("file") or "out.mp4")
        if not stab_out.exists():
            raise RuntimeError("안정화 결과 파일이 없습니다")

        # ── ③ enhance (업스케일·슬로모션·보간)
        eid = st.get("enh_job")
        enh = EJ.get_status(eid) if eid else None
        if not enh or enh.get("status") != "done":
            if not enh:
                eid = EJ.new_job({
                    "upscale": params.get("upscale", "4k"),
                    "speed": float(params.get("speed", 0.5)),
                    "interpolate": params.get("interpolate", "smooth"),
                    "model": params.get("model", "photo"),
                    "fps": int(params.get("fps", 0) or 0),
                })
                _set(enh_job=eid)
            if not EJ.input_path(eid).exists():
                shutil.copy2(stab_out, EJ.input_path(eid))
            enh = _run_sub("packages.enhancer.cli", EJ, eid, "enhance", _set)

        # ── ④ finalize — 결과를 showcase 잡 폴더로 가져오고 서브 잡 정리
        out_mp4 = jdir / "out.mp4"
        shutil.copy2(EJ.job_path(eid) / "out.mp4", out_mp4)
        enh_out = (enh.get("outputs") or [{}])[0]
        outputs = [{"variant": "showcase", "file": "out.mp4",
                    "metrics": enh_out.get("metrics") or {}}]
        note = enh.get("note")
        for sub_dir in (SJ.job_path(sid), EJ.job_path(eid)):
            shutil.rmtree(sub_dir, ignore_errors=True)
        _set(status="done", stage="done", progress=100, outputs=outputs,
             note=note, sub=None, stab_job=None, enh_job=None)
    except Exception as e:  # noqa: BLE001 — 실패를 status 에 남기고 종료
        log.exception("showcase job 실패: %s", job_id)
        _set(status="failed", error=str(e)[:500], sub=None)
