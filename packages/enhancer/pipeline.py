"""화질 개선 잡 파이프라인 — probe → extract → upscale → interpolate → encode.

설계: docs/video-enhance-plan.md. 각 단계는 프레임 파일 단위로 증분·멱등:
- extract/interpolate: 완료 마커(.done)가 있으면 skip, 부분 산출물은 처음부터(빠른 단계)
- upscale: 누락/불완전 프레임만 재처리(PNG IEND 꼬리 검사) — 지배 비용이라 이어가기 필수
진행률은 출력 폴더 PNG 개수 폴링(§3 — ncnn stderr % 파싱보다 단순·정확).
외부 프로세스(ncnn/ffmpeg) stderr 는 logs/<단계>.log 로 남긴다(파이프 데드락 방지 + 진단).
"""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

from . import job as J
from .config import check_binaries, enhance_config
from .plan import build_plan

log = logging.getLogger(__name__)

_POLL_SEC = 2.0


# --- 유틸 --------------------------------------------------------


def _count_png(d: Path) -> int:
    return sum(1 for _ in d.glob("*.png")) if d.exists() else 0


def _png_ok(p: Path) -> bool:
    """PNG 완결성 검사 — 꼬리에 IEND 청크가 있으면 완성본(중단된 쓰기 감지, O(1))."""
    try:
        if not p.exists() or p.stat().st_size < 100:
            return False
        with p.open("rb") as f:
            f.seek(-12, 2)
            return b"IEND" in f.read()
    except OSError:
        return False


def _png_size(p: Path) -> tuple[int, int]:
    """PNG 실측 크기 — 회전 메타 적용 후 프레임 기준(§3 함정 회피)."""
    from PIL import Image

    with Image.open(p) as im:
        return im.size  # (w, h)


def _run_logged(cmd: list[Any], log_file: Path,
                on_poll: Callable[[], None] | None = None) -> int:
    """외부 프로세스 실행. stdout/stderr → log_file(append), on_poll 을 주기 호출."""
    args = [str(c) for c in cmd]
    with log_file.open("ab") as lf:
        lf.write(("$ " + " ".join(args) + "\n").encode("utf-8", "replace"))
        lf.flush()
        proc = subprocess.Popen(args, stdout=lf, stderr=lf)
        while True:
            rc = proc.poll()
            if rc is not None:
                return rc
            if on_poll:
                try:
                    on_poll()
                except Exception:  # noqa: BLE001 — 진행률 보고 실패가 잡을 죽이지 않게
                    pass
            time.sleep(_POLL_SEC)


def _log_tail(log_file: Path, n: int = 400) -> str:
    try:
        return log_file.read_text(encoding="utf-8", errors="replace")[-n:]
    except OSError:
        return ""


def _prog(set_status: Callable[..., Any], stage: str, lo: int, hi: int) -> Callable[[float], None]:
    """단계 내 진행 비율(0~1) → 전체 진행률 [lo,hi] 보고 콜백."""
    def cb(frac: float) -> None:
        frac = max(0.0, min(1.0, frac))
        set_status(stage=stage, progress=min(hi, lo + int((hi - lo) * frac)))
    return cb


def probe_input(ffprobe: str, path: Path) -> dict[str, Any]:
    """입력 메타 — 회전 반영 표시 크기·fps(유리수 포함)·길이·오디오 유무."""
    cmd = [ffprobe, "-v", "error", "-select_streams", "v:0",
           "-show_entries",
           "stream=width,height,avg_frame_rate,r_frame_rate,nb_frames,codec_name"
           ":stream_side_data=rotation",
           "-show_entries", "format=duration,format_name", "-of", "json", str(path)]
    out = subprocess.run(cmd, capture_output=True, text=True)
    j = json.loads(out.stdout or "{}")
    st = (j.get("streams") or [{}])[0]

    def _fps(rat: str) -> float:
        num, _, den = (rat or "0/1").partition("/")
        try:
            return float(num) / float(den or 1) if float(den or 0) else 0.0
        except ValueError:
            return 0.0

    fps_rat = st.get("avg_frame_rate") or "0/1"
    fps = _fps(fps_rat)
    if fps <= 0:
        fps_rat = st.get("r_frame_rate") or "30/1"
        fps = _fps(fps_rat) or 30.0
    rotation = 0
    for sd in st.get("side_data_list") or []:
        if "rotation" in sd:
            try:
                rotation = int(sd["rotation"])
            except (TypeError, ValueError):
                pass
    w, h = int(st.get("width", 0)), int(st.get("height", 0))
    if rotation % 180 != 0:  # ±90도 — 표시 기준으로 스왑(iPhone 세로 영상)
        w, h = h, w
    fmt = j.get("format") or {}
    # 오디오 스트림 유무
    a = subprocess.run([ffprobe, "-v", "error", "-select_streams", "a:0",
                        "-show_entries", "stream=codec_name", "-of", "json", str(path)],
                       capture_output=True, text=True)
    has_audio = bool(json.loads(a.stdout or "{}").get("streams") or [])
    return {
        "width": w, "height": h, "fps": round(fps, 3), "fps_rat": fps_rat,
        "codec": st.get("codec_name"), "format": fmt.get("format_name"),
        "duration": round(float(fmt.get("duration", 0) or 0), 2),
        "has_audio": has_audio,
    }


def _check_disk(cfg: dict[str, Any], root: Path) -> None:
    need = float(cfg.get("min_free_gb", 0) or 0)
    if need <= 0:
        return
    free_gb = shutil.disk_usage(root).free / (1024 ** 3)
    if free_gb < need:
        raise RuntimeError(
            f"디스크 여유 부족: {free_gb:.0f}GB < 최소 {need:.0f}GB "
            "(중간 PNG 프레임이 수 GB 를 차지합니다)")


# --- 단계 --------------------------------------------------------


def _extract(cfg: dict, inp: Path, dst: Path, fps_rat: str, expected: int,
             prog: Callable[[float], None], logf: Path) -> None:
    """프레임 → PNG. 자동 회전 적용됨. 부분 추출은 재시작(추출은 빠름)."""
    done = dst / ".done"
    if done.exists() and _count_png(dst) > 0:
        return
    if dst.exists():
        shutil.rmtree(dst, ignore_errors=True)
    dst.mkdir(parents=True, exist_ok=True)
    cmd = [cfg["ffmpeg"], "-hide_banner", "-v", "error", "-y", "-i", inp,
           "-vf", f"fps={fps_rat}", dst / "%08d.png"]
    rc = _run_logged(cmd, logf, on_poll=lambda: prog(_count_png(dst) / max(expected, 1)))
    if rc != 0 or _count_png(dst) == 0:
        raise RuntimeError(f"프레임 추출 실패(exit {rc}): {_log_tail(logf)}")
    done.touch()


def _upscale(cfg: dict, src: Path, dst: Path, model: str, jdir: Path,
             prog: Callable[[float], None], logf: Path) -> None:
    """Real-ESRGAN x4 — 누락/불완전 출력 프레임만 재처리(증분)."""
    dst.mkdir(parents=True, exist_ok=True)
    names = sorted(p.name for p in src.glob("*.png"))
    missing = [n for n in names if not _png_ok(dst / n)]
    for n in missing:  # 불완전 파일 제거 후 재생성
        (dst / n).unlink(missing_ok=True)
    if missing:
        bin_ = Path(cfg["realesrgan_bin"])
        model_name = cfg["esrgan_models"].get(model, model)
        if len(missing) == len(names):
            in_dir = src
        else:  # 일부만 남음 — 누락 프레임만 모아 임시 입력 폴더 구성
            in_dir = jdir / "up_todo"
            shutil.rmtree(in_dir, ignore_errors=True)
            in_dir.mkdir(parents=True)
            for n in missing:
                shutil.copy2(src / n, in_dir / n)
        cmd = [bin_, "-i", in_dir, "-o", dst, "-n", model_name, "-s", 4,
               "-f", "png", "-m", bin_.parent / "models"]
        rc = _run_logged(cmd, logf, on_poll=lambda: prog(_count_png(dst) / max(len(names), 1)))
        if in_dir is not src:
            shutil.rmtree(in_dir, ignore_errors=True)
        if rc != 0:
            raise RuntimeError(f"업스케일 실패(exit {rc}): {_log_tail(logf)}")
    got = _count_png(dst)
    if got != len(names):
        raise RuntimeError(f"업스케일 프레임수 불일치: {got}/{len(names)}")


def _rife(cfg: dict, src: Path, dst: Path, n_out: int,
          prog: Callable[[float], None], logf: Path) -> None:
    """RIFE 보간 — 균일 재타이밍이라 부분 이어가기 불가, 완료 마커 없으면 전체 재실행."""
    done = dst / ".done"
    if done.exists() and _count_png(dst) == n_out:
        return
    if dst.exists():
        shutil.rmtree(dst, ignore_errors=True)
    dst.mkdir(parents=True, exist_ok=True)
    bin_ = Path(cfg["rife_bin"])
    cmd = [bin_, "-i", src, "-o", dst, "-m", bin_.parent / cfg["rife_model"],
           "-n", n_out, "-f", "%08d.png"]
    rc = _run_logged(cmd, logf, on_poll=lambda: prog(_count_png(dst) / max(n_out, 1)))
    if rc != 0:
        raise RuntimeError(f"프레임 보간 실패(exit {rc}): {_log_tail(logf)}")
    got = _count_png(dst)
    if got != n_out:
        raise RuntimeError(f"보간 프레임수 불일치: {got}/{n_out}")
    done.touch()


def _encode(cfg: dict, frames: Path, inp: Path, out_mp4: Path, plan_d: dict,
            with_audio: bool, logf: Path) -> None:
    """PNG 시퀀스 → H.264. NVENC 실패 시 libx264 폴백(stabilizer 패턴)."""
    ff = cfg["ffmpeg"]
    fps = plan_d.get("out_fps_rat") or f"{plan_d['out_fps']:.6f}"
    vf = f"scale={plan_d['out_w']}:{plan_d['out_h']}:flags=lanczos,format=yuv420p"

    def _cmd(codec: list[str]) -> list[Any]:
        c = [ff, "-hide_banner", "-v", "error", "-y",
             "-framerate", fps, "-i", frames / "%08d.png"]
        if with_audio:
            c += ["-i", inp]
        c += ["-vf", vf] + codec
        if with_audio:  # 배속 1일 때만 원본 오디오 합류
            c += ["-map", "0:v:0", "-map", "1:a:0?", "-c:a", "aac", "-b:a", "192k", "-shortest"]
        c += [out_mp4]
        return c

    nvenc = ["-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "19", "-b:v", "0"]
    x264 = ["-c:v", "libx264", "-preset", "slow", "-crf", "18"]
    first = nvenc if cfg.get("encoder") == "h264_nvenc" else x264
    rc = _run_logged(_cmd(first), logf)
    if rc != 0 and first is nvenc:
        out_mp4.unlink(missing_ok=True)
        rc = _run_logged(_cmd(x264), logf)
    if rc != 0 or not out_mp4.exists() or out_mp4.stat().st_size == 0:
        raise RuntimeError(f"인코딩 실패(exit {rc}): {_log_tail(logf)}")


# --- 오케스트레이션 ----------------------------------------------


def run_job(job_id: str) -> None:
    st = J.get_status(job_id)
    if st is None:
        raise SystemExit(f"job not found: {job_id}")
    cfg = enhance_config()
    J.set_status(job_id, status="running", stage="probe", progress=0, error=None)

    def _set(**kw: Any) -> None:
        J.set_status(job_id, **kw)

    try:
        params = st.get("params") or {}
        probs = check_binaries(cfg, params.get("model", cfg["default_model"]))
        if probs:
            raise RuntimeError("필수 도구 없음:\n" + "\n".join(probs))
        jdir = J.job_path(job_id)
        inp = J.input_path(job_id)
        logs = jdir / "logs"
        logs.mkdir(exist_ok=True)
        _check_disk(cfg, jdir)

        meta = probe_input(cfg["ffprobe"], inp)
        if meta["duration"] <= 0 and meta["fps"] <= 0:
            raise RuntimeError("영상 정보를 읽을 수 없습니다(지원하지 않는 파일?)")
        maxs = float(cfg.get("max_input_seconds", 0) or 0)
        if maxs and meta["duration"] > maxs:
            raise RuntimeError(
                f"입력이 너무 깁니다({meta['duration']:.0f}초 > 제한 {maxs:.0f}초) — "
                "업스케일 비용이 프레임당 초 단위라 짧은 영상만 받습니다")

        # 예비 계획(probe 추정치) — 예상 소요·진행 구간을 UI 에 먼저 보여준다
        n_est = max(1, round(meta["duration"] * meta["fps"]) or 1)
        pl = build_plan({"frame_w": meta["width"], "frame_h": meta["height"],
                         "fps": meta["fps"], "fps_rat": meta["fps_rat"],
                         "n_frames": n_est}, params, cfg)
        _set(input=meta, plan=pl)

        # ① extract
        fdir = jdir / "frames_in"
        lo, hi = pl["stages"]["extract"]
        _set(stage="extract", progress=lo)
        _extract(cfg, inp, fdir, meta["fps_rat"], n_est,
                 _prog(_set, "extract", lo, hi), logs / "extract.log")

        # 실측 재계획 — 회전 반영 프레임 크기 + 실제 프레임수(§3 함정)
        first_png = next(iter(sorted(fdir.glob("*.png"))))
        fw, fh = _png_size(first_png)
        n_in = _count_png(fdir)
        pl = build_plan({"frame_w": fw, "frame_h": fh, "fps": meta["fps"],
                         "fps_rat": meta["fps_rat"], "n_frames": n_in}, params, cfg)
        _set(plan=pl)

        cur = fdir
        # ② upscale
        if pl["upscale_on"]:
            updir = jdir / "frames_up"
            lo, hi = pl["stages"]["upscale"]
            _set(stage="upscale", progress=lo)
            _upscale(cfg, cur, updir, params.get("model", cfg["default_model"]),
                     jdir, _prog(_set, "upscale", lo, hi), logs / "upscale.log")
            cur = updir
        # ③ interpolate
        if pl["rife_on"]:
            rfdir = jdir / "frames_rife"
            lo, hi = pl["stages"]["interpolate"]
            _set(stage="interpolate", progress=lo)
            _rife(cfg, cur, rfdir, pl["n_out"],
                  _prog(_set, "interpolate", lo, hi), logs / "interpolate.log")
            cur = rfdir
        # ④ encode
        lo, hi = pl["stages"]["encode"]
        _set(stage="encode", progress=lo)
        speed = float(params.get("speed", cfg["default_speed"]))
        with_audio = bool(meta.get("has_audio")) and speed == 1.0
        out_mp4 = jdir / "out.mp4"
        _encode(cfg, cur, inp, out_mp4, pl, with_audio, logs / "encode.log")

        # 완료 — 중간 프레임 정리(§3 디스크: 장당 30~50MB)
        for d in (jdir / "frames_in", jdir / "frames_up", jdir / "frames_rife"):
            shutil.rmtree(d, ignore_errors=True)
        note = None
        if meta.get("has_audio") and not with_audio:
            note = "배속을 바꿔 소리는 제거했습니다(원본 속도(1x)에서만 소리 유지)."
        outputs = [{"variant": "enhanced", "file": "out.mp4", "metrics": {
            "out_w": pl["out_w"], "out_h": pl["out_h"], "out_fps": pl["out_fps"],
            "n_frames": pl["n_out"], "duration": pl["out_duration"],
        }}]
        _set(status="done", stage="done", progress=100, outputs=outputs, note=note)
    except Exception as e:  # noqa: BLE001 — 실패를 status 에 남기고 종료
        log.exception("enhance job 실패: %s", job_id)
        _set(status="failed", error=str(e)[:500])
