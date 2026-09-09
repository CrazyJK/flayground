"""연출 클립(영상 스튜디오) 잡 파이프라인 — trim → stabilize(서브 잡) → enhance(서브 잡) → finalize.

각 단계는 선택 가능하다: 구간이 전체이고 구역이 없으면 trim 생략, `stabilize=off` 면 안정화
생략, `enhance=off` 면 화질 개선 생략. 안정화만 = 기존 안정화 화면, 화질만 = 기존 화질 화면,
둘 다 = 연출 클립. 기존 stabilizer·enhancer 는 수정 없이 재사용한다: 각각의 잡을 생성해 별도
프로세스(python -m packages.<pkg>.cli run)로 순차 실행하고 status.json 을 폴링해 진행률을
하나로 매핑한다. 별도 프로세스로 돌리는 이유는 stabilizer 설계와 동일 — CUDA(YOLO)·Vulkan(ncnn)
자원이 단계 사이에 완전히 해제되게 한다(12GB GPU 공유).

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

STABILIZE_MODES = ("off", "background", "person")

# 단계별 상대 비용(진행률 배분용). enhance(업스케일)가 지배 비용, 안정화만이면 안정화가 대부분.
# photos(선명 프레임 선별)·upscale(선택 N장만) 은 사진 출력 모드 전용.
_STAGE_WEIGHT = {"trim": 5, "stabilize": 20, "enhance": 70, "photos": 30, "upscale": 30}


def output_mode(params: dict[str, Any]) -> str:
    """출력 모드 — "photos"(베스트 사진 N장) 또는 "video"(기본)."""
    return "photos" if params.get("output") == "photos" else "video"


def stabilize_mode(params: dict[str, Any]) -> str:
    """params 의 안정화 모드 — 신 키 `stabilize`, 구 키 `mode`(person 고정 시절) 순으로 읽는다."""
    m = params.get("stabilize") or params.get("mode") or "person"
    return m if m in STABILIZE_MODES else "person"


def enhance_on(params: dict[str, Any]) -> bool:
    """params 의 화질 개선 단계 사용 여부(기본 켬)."""
    v = params.get("enhance", True)
    if isinstance(v, str):
        return v.lower() not in ("0", "false", "off", "no")
    return bool(v)


def plan_stages(params: dict[str, Any], duration: float) -> dict[str, tuple[int, int]]:
    """활성 단계와 진행률 구간(0~99) — 삽입 순서가 실행 순서.

    Args:
        params: 잡 파라미터(start/end/region/stabilize/enhance).
        duration: 입력 길이(초). 구간이 이를 덮고 구역이 없으면 trim 을 생략한다.

    Returns:
        {단계명: (lo, hi)} — 아무 단계도 없으면 빈 dict(호출측이 거부).
    """
    start = float(params.get("start", 0) or 0)
    end = float(params.get("end", 0) or 0)
    full = start <= 0 and (end <= 0 or end >= duration - 0.05)
    active: list[str] = []
    if not full or params.get("region"):
        active.append("trim")
    if output_mode(params) == "photos":
        active.append("photos")
        if params.get("upscale", "none") != "none":
            active.append("upscale")
    else:
        if stabilize_mode(params) != "off":
            active.append("stabilize")
        if enhance_on(params):
            active.append("enhance")
    total = sum(_STAGE_WEIGHT[s] for s in active) or 1
    out: dict[str, tuple[int, int]] = {}
    acc = 0
    for s in active:
        lo = round(99 * acc / total)
        acc += _STAGE_WEIGHT[s]
        out[s] = (lo, round(99 * acc / total))
    return out


def _venv_python() -> str:
    return str(REPO_ROOT / ".venv" / "Scripts" / "python.exe")


def _run_sub(module: str, jobmod: Any, sub_id: str, stage: str,
             rng: tuple[int, int], set_status: Any) -> dict[str, Any]:
    """서브 잡을 별도 프로세스로 실행하고 완료까지 폴링. done 이 아니면 예외.

    Args:
        module: 워커 모듈 경로(예: "packages.stabilizer.cli").
        jobmod: 해당 패키지의 job 모듈(get_status 사용).
        sub_id: 서브 잡 id.
        stage: showcase 단계명.
        rng: 이 단계가 차지하는 전체 진행률 구간 (lo, hi).
        set_status: showcase status 갱신 콜백.

    Returns:
        완료된 서브 잡의 status dict.
    """
    lo, hi = rng
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


def _region_crop(region: dict[str, Any]) -> str:
    """구역(0~1 상대 사각형) → ffmpeg crop 필터 문자열(iw/ih 비율 표현식).

    픽셀 대신 표현식을 쓰는 이유: ffprobe 의 width/height 는 회전·클린 애퍼처(라이브 포토의
    가장자리 자르기 메타)가 반영되기 전 값이라, 픽셀로 계산하면 실제 디코딩 프레임을 넘어
    crop 이 거부될 수 있다. 표현식은 자동 회전·자르기가 끝난 실제 프레임 기준으로 평가된다.
    한 변 하한 5%(UI 와 동일), 짝수 정렬, 프레임 안으로 클램프.

    Args:
        region: {"x","y","w","h"} 표시 프레임 기준 상대 좌표(0~1).

    Returns:
        "crop=W:H:X:Y" 필터 문자열(각 항은 표현식).
    """
    x = min(max(float(region.get("x", 0)), 0.0), 1.0)
    y = min(max(float(region.get("y", 0)), 0.0), 1.0)
    w = min(max(float(region.get("w", 1)), 0.0), 1.0 - x)
    h = min(max(float(region.get("h", 1)), 0.0), 1.0 - y)
    # 필터그래프 안의 콤마는 \, 로 이스케이프. out_w/out_h 는 x/y 식에서 참조 가능.
    cw = f"min(max(floor(iw*{w:.4f}/2)*2\\,floor(iw*0.05/2)*2)\\,floor(iw/2)*2)"
    ch = f"min(max(floor(ih*{h:.4f}/2)*2\\,floor(ih*0.05/2)*2)\\,floor(ih/2)*2)"
    cx = f"min(floor(iw*{x:.4f}/2)*2\\,iw-out_w)"
    cy = f"min(floor(ih*{y:.4f}/2)*2\\,ih-out_h)"
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


def _stab_options(params: dict[str, Any], start: float, dur: float) -> dict[str, Any]:
    """stabilizer 서브 잡 options — 클릭 좌표는 트림(시간)·구역(공간) 기준으로 변환."""
    options: dict[str, Any] = {"edge": params.get("edge", "crop")}
    region = params.get("region")
    subject = params.get("subject")
    if subject:
        t = min(max(float(subject.get("t", 0)) - start, 0.0), dur)
        sx, sy = float(subject.get("x", 0.5)), float(subject.get("y", 0.5))
        if region:  # 원본 기준 클릭 → 크롭된 프레임 기준 상대좌표
            rw = max(float(region.get("w", 1)), 1e-6)
            rh = max(float(region.get("h", 1)), 1e-6)
            sx = min(max((sx - float(region.get("x", 0))) / rw, 0.0), 1.0)
            sy = min(max((sy - float(region.get("y", 0))) / rh, 0.0), 1.0)
        options["subject"] = {"t": round(t, 3), "x": round(sx, 4), "y": round(sy, 4)}
    if params.get("scale_lock"):
        options["scale_lock"] = True
    if params.get("lowfps"):  # 저fps(gif 등) 입력 보간 — stabilizer 의 interpolate 옵션
        options["interpolate"] = True
    return options


def _run_photos(cfg: dict, params: dict[str, Any], jdir: Path, src: Path,
                stages: dict[str, tuple[int, int]], set_status: Any) -> list[dict[str, Any]]:
    """사진 출력 모드 — 선명도 상위 N장 선별 → (옵션) 업스케일 → photos/*.png + photos.zip.

    Args:
        src: 점수 대상 영상(트림본 또는 원본).
        stages: plan_stages 결과("photos", 선택 "upscale").

    Returns:
        outputs — variant "photo"(파일·시각·점수·크기) N개 + variant "zip".
    """
    from PIL import Image

    from packages.enhancer.config import enhance_config

    from .photos import extract_frames, score_video, select_best, upscale_photos, zip_dir

    n = max(1, int(params.get("photo_n", 5) or 5))
    gap_sec = max(0.0, float(params.get("photo_gap", 0.3) or 0))
    fps = float(probe_input(cfg["ffprobe"], src)["fps"] or 30.0)
    start = float(params.get("start", 0) or 0) if "trim" in stages else 0.0

    lo, hi = stages["photos"]
    set_status(stage="photos", progress=lo, sub=None)
    scored = score_video(src, lambda f: set_status(progress=lo + int((hi - lo) * 0.7 * f)))
    if not scored:
        raise RuntimeError("프레임을 읽을 수 없습니다")
    chosen = select_best(scored, n, int(round(gap_sec * fps)))
    frames_dir = jdir / "photos_src"
    shutil.rmtree(frames_dir, ignore_errors=True)
    extract_frames(cfg["ffmpeg"], src, [c[0] for c in chosen], frames_dir)
    set_status(progress=hi)

    photos_dir = jdir / "photos"
    shutil.rmtree(photos_dir, ignore_errors=True)
    if "upscale" in stages:
        ulo, uhi = stages["upscale"]
        set_status(stage="upscale", progress=ulo)
        cfg_e = enhance_config()
        if not Path(cfg_e["realesrgan_bin"]).exists():
            raise RuntimeError(f"realesrgan 바이너리 없음: {cfg_e['realesrgan_bin']}")
        (jdir / "logs").mkdir(exist_ok=True)
        upscale_photos(cfg_e, frames_dir, photos_dir, params.get("upscale", "2x"),
                       params.get("model", "photo"), jdir / "logs" / "upscale.log")
        set_status(progress=uhi)
    else:
        shutil.copytree(frames_dir, photos_dir)

    outputs: list[dict[str, Any]] = []
    for k, (idx, sharp, _blown) in enumerate(chosen, 1):
        t = start + idx / fps
        name = f"best_{k:02d}_t{t:.2f}s.png"
        (photos_dir / f"f_{idx:08d}.png").rename(photos_dir / name)
        with Image.open(photos_dir / name) as im:
            w, h = im.size
        outputs.append({"variant": "photo", "file": f"photos/{name}", "t": round(t, 2),
                        "frame": idx, "score": round(sharp, 1), "w": w, "h": h})
    zip_dir(photos_dir, jdir / "photos.zip")
    outputs.append({"variant": "zip", "file": "photos.zip", "count": len(chosen)})
    shutil.rmtree(frames_dir, ignore_errors=True)
    shutil.rmtree(jdir / "photos_x4", ignore_errors=True)
    return outputs


def run_job(job_id: str) -> None:
    """showcase 잡 실행 — cli(서브프로세스)가 호출. 실패는 status 에 남긴다."""
    st = J.get_status(job_id)
    if st is None:
        raise SystemExit(f"job not found: {job_id}")
    cfg = showcase_config()
    J.set_status(job_id, status="running", stage="probe", progress=0, error=None)

    def _set(**kw: Any) -> None:
        J.set_status(job_id, **kw)

    try:
        params = st.get("params") or {}
        jdir = J.job_path(job_id)
        inp = J.input_path(job_id)

        # ── probe + 구간 검증 + 단계 계획
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
        stages = plan_stages(params, meta["duration"])
        if not stages:
            raise RuntimeError("실행할 단계가 없습니다(구간·구역·안정화·화질 중 하나는 지정)")
        maxs = float(cfg.get("max_clip_seconds", 0) or 0)
        if "enhance" in stages and maxs and dur > maxs:
            raise RuntimeError(
                f"구간이 너무 깁니다({dur:.1f}초 > 제한 {maxs:.0f}초) — "
                "업스케일 비용이 프레임당 초 단위라 짧은 구간만 받습니다")
        maxp = float(cfg.get("max_photo_seconds", 0) or 0)
        if "photos" in stages and maxp and dur > maxp:
            raise RuntimeError(f"구간이 너무 깁니다({dur:.1f}초 > 사진 모드 제한 {maxp:.0f}초)")
        _set(input=meta, stages=list(stages))

        # ── ① trim (+ 구역 크롭 — 지정 시 원본 해상도에서 해당 사각형만 잘라냄)
        cur = inp
        if "trim" in stages:
            region = params.get("region")
            crop = _region_crop(region) if region else None
            trim_mp4 = jdir / "trim.mp4"
            _set(stage="trim", progress=stages["trim"][0] + 1)
            _trim(cfg, inp, trim_mp4, start, dur, bool(meta.get("has_audio")), crop)
            _set(progress=stages["trim"][1])
            cur = trim_mp4

        # ── 사진 출력 모드: 안정화·화질 단계 대신 선명 프레임 선별(+업스케일)로 마무리
        if output_mode(params) == "photos":
            outputs = _run_photos(cfg, params, jdir, cur, stages, _set)
            _set(status="done", stage="done", progress=100, outputs=outputs,
                 note=None, sub=None, stab_job=None, enh_job=None)
            return

        # ── ② stabilize (background=vidstab | person=피사체 추적 고정)
        sid = st.get("stab_job")
        if "stabilize" in stages:
            stab = SJ.get_status(sid) if sid else None
            if not stab or stab.get("status") != "done":
                if not stab:
                    sid = SJ.new_job(stabilize_mode(params), params.get("strength", "smooth"),
                                     _stab_options(params, start, dur))
                    _set(stab_job=sid)
                if not SJ.input_path(sid).exists():
                    shutil.copy2(cur, SJ.input_path(sid))
                stab = _run_sub("packages.stabilizer.cli", SJ, sid, "stabilize",
                                stages["stabilize"], _set)
            stab_out = SJ.job_path(sid) / ((stab.get("outputs") or [{}])[0].get("file") or "out.mp4")
            if not stab_out.exists():
                raise RuntimeError("안정화 결과 파일이 없습니다")
            cur = stab_out

        # ── ③ enhance (업스케일·슬로모션·보간)
        eid = st.get("enh_job")
        note = None
        metrics: dict[str, Any] = {}
        if "enhance" in stages:
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
                    shutil.copy2(cur, EJ.input_path(eid))
                enh = _run_sub("packages.enhancer.cli", EJ, eid, "enhance",
                               stages["enhance"], _set)
            cur = EJ.job_path(eid) / "out.mp4"
            metrics = (enh.get("outputs") or [{}])[0].get("metrics") or {}
            note = enh.get("note")

        # ── ④ finalize — 결과를 showcase 잡 폴더로 가져오고 서브 잡 정리
        out_mp4 = jdir / "out.mp4"
        if cur != out_mp4:
            shutil.copy2(cur, out_mp4)
        if params.get("mute"):  # 오디오 제거 — 재인코딩 없이 비디오만 리먹스
            muted = jdir / "out_mute.mp4"
            p = subprocess.run([cfg["ffmpeg"], "-hide_banner", "-v", "error", "-y",
                                "-i", str(out_mp4), "-an", "-c:v", "copy",
                                "-movflags", "+faststart", str(muted)],
                               capture_output=True, text=True)
            if p.returncode != 0 or not muted.exists():
                raise RuntimeError(f"오디오 제거 실패: {(p.stderr or '')[-300:]}")
            muted.replace(out_mp4)
        if not metrics:  # 화질 단계가 없으면 결과 파일을 직접 측정
            m = probe_input(cfg["ffprobe"], out_mp4)
            metrics = {"out_w": m["width"], "out_h": m["height"], "out_fps": m["fps"],
                       "duration": m["duration"]}
        outputs = [{"variant": "showcase", "file": "out.mp4", "metrics": metrics}]
        for sub_dir in (SJ.job_path(sid) if sid else None, EJ.job_path(eid) if eid else None):
            if sub_dir:
                shutil.rmtree(sub_dir, ignore_errors=True)
        _set(status="done", stage="done", progress=100, outputs=outputs,
             note=note, sub=None, stab_job=None, enh_job=None)
    except Exception as e:  # noqa: BLE001 — 실패를 status 에 남기고 종료
        log.exception("showcase job 실패: %s", job_id)
        _set(status="failed", error=str(e)[:500], sub=None)
