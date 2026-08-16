"""옵션 → 실행 계획 산출 (순수 함수 — 단위 테스트 대상, 외부 의존 없음).

docs/flay-ai/video-enhance-plan.md §1 수식:
    출력 길이     = 입력 길이 / 배속
    필요 프레임수 = 입력 프레임수 × (출력 fps / 입력 fps) / 배속
    RIFE 배수     = 필요 프레임수 / 입력 프레임수   (1이면 보간 생략)

슬로모션은 "프레임 반복"이 아니라 "RIFE 로 프레임수를 늘려 원본 fps 로 인코딩"이 원칙.
보간을 끄면 fps 를 배속만큼 낮춰 재생 시간만 늘린다(프레임 생성 없음).

해상도는 **회전 적용 후 실측 프레임 크기** 기준으로 계산할 것(§3 함정 — probe 의
width/height 는 회전 전 값이라 세로 영상이 눌린다).
"""

from __future__ import annotations

from typing import Any

UPSCALE_MODES = ("none", "2x", "4k")
SPEEDS = (1.0, 0.5, 0.25)
INTERP_MODES = ("off", "smooth")

# h264 인코더(NVENC 포함) 한 변 상한 — 넘으면 비율 유지 축소
_H264_MAX_DIM = 4096


def _even(x: float) -> int:
    return max(2, (int(x) // 2) * 2)  # 내림 짝수 보정(ffmpeg scale=-2 관례)


def rife_target(n_frames: int, speed: float, interp: str, fps_ratio: float = 1.0) -> int:
    """RIFE 목표 프레임수 = 입력 × (출력fps/입력fps) / 배속. 입력과 같으면 보간 생략.

    fps_ratio: 출력fps/입력fps (60fps 옵션 등. 1=fps 유지). 다운샘플은 하지 않는다.
    """
    if interp != "smooth":
        return n_frames
    return max(n_frames, round(n_frames * max(fps_ratio, 1.0) / speed))


def out_fps(fps: float, speed: float, interp: str) -> float:
    """인코딩 fps. smooth=원본 fps 유지(프레임을 늘려 슬로모션), off=fps 를 낮춰 슬로모션."""
    return fps if interp == "smooth" else fps * speed


def out_fps_rat(fps_rat: str, speed: float, interp: str) -> str:
    """유리수 fps 문자열("30000/1001")의 배속 반영판 — ffmpeg -framerate 용."""
    num, _, den = fps_rat.partition("/")
    if interp == "smooth" or speed >= 1:
        return fps_rat
    k = round(1 / speed)  # 0.5→2, 0.25→4
    return f"{num}/{int(den or 1) * k}"


def encode_size(frame_w: int, frame_h: int, upscale: str,
                target_short: int = 2160) -> tuple[int, int]:
    """인코딩 목표 해상도(짝수 보정). 입력은 회전 적용 후 프레임 실측 크기.

    - none: 원본 유지
    - 2x:   가로세로 2배
    - 4k:   짧은 변을 target_short 로(가로 3840x2160 / 세로 2160x3840),
            긴 변이 h264 상한(4096)을 넘으면 비율 유지 축소
    """
    if upscale == "none":
        return _even(frame_w), _even(frame_h)
    if upscale == "2x":
        return _even(frame_w * 2), _even(frame_h * 2)
    short = min(frame_w, frame_h)
    scale = target_short / max(short, 1)
    if max(frame_w, frame_h) * scale > _H264_MAX_DIM:
        scale = _H264_MAX_DIM / max(frame_w, frame_h)
    return _even(frame_w * scale), _even(frame_h * scale)


def build_stages(n_in: int, n_out: int, upscale_on: bool, rife_on: bool,
                 estimates: dict[str, float] | None = None) -> dict[str, Any]:
    """실행할 단계 목록 + 진행률 구간(예상 소요 시간 비례 배분) + 총 예상 초.

    반환 stages 는 {단계명: (lo, hi)} — 삽입 순서가 실행 순서(UI 단계 불빛도 이 순서).
    """
    e = {"extract_spf": 0.02, "upscale_spf": 4.5, "rife_spf": 0.3, "encode_spf": 0.08}
    e.update(estimates or {})
    items: list[tuple[str, float]] = [("extract", n_in * e["extract_spf"])]
    if upscale_on:
        items.append(("upscale", n_in * e["upscale_spf"]))
    if rife_on:
        items.append(("interpolate", n_out * e["rife_spf"]))
    items.append(("encode", n_out * e["encode_spf"]))
    total = sum(sec for _, sec in items) or 1.0
    stages: dict[str, tuple[int, int]] = {}
    acc = 0.0
    for name, sec in items:
        lo = round(100 * acc / total)
        acc += sec
        stages[name] = (lo, round(100 * acc / total))
    return {"stages": stages, "total_seconds": round(total)}


def build_plan(meta: dict[str, Any], params: dict[str, Any], cfg: dict[str, Any]) -> dict[str, Any]:
    """입력 메타 + 옵션 → 실행 계획.

    meta:   frame_w/frame_h(회전 반영), fps, n_frames, (선택) fps_rat
    params: upscale, speed, interpolate, model
    """
    upscale = params.get("upscale", cfg.get("default_upscale", "4k"))
    speed = float(params.get("speed", cfg.get("default_speed", 0.5)))
    interp = params.get("interpolate", cfg.get("default_interpolate", "smooth"))
    n_in = max(1, int(meta["n_frames"]))
    fps = float(meta.get("fps") or 30.0)

    # 출력 fps 목표(60fps 옵션) — smooth 보간 + 입력 fps 보다 높을 때만 유효.
    # 입력이 이미 목표 이상이면 무시(다운샘플 안 함), 보간 off 면 생성할 프레임이 없어 무시.
    target_fps = float(params.get("fps") or 0)
    eff_fps = target_fps if (interp == "smooth" and target_fps > fps) else 0.0

    n_out = rife_target(n_in, speed, interp, fps_ratio=(eff_fps / fps) if eff_fps else 1.0)
    rife_on = n_out != n_in
    upscale_on = upscale in ("2x", "4k")
    ofps = eff_fps if eff_fps else out_fps(fps, speed, interp)
    ow, oh = encode_size(int(meta["frame_w"]), int(meta["frame_h"]), upscale,
                         int(cfg.get("target_height", 2160)))
    st = build_stages(n_in, n_out, upscale_on, rife_on, cfg.get("estimates"))
    plan: dict[str, Any] = {
        "n_in": n_in, "n_out": n_out,
        "upscale_on": upscale_on, "rife_on": rife_on,
        "out_w": ow, "out_h": oh,
        "out_fps": round(ofps, 3),
        "out_duration": round(n_out / ofps, 2) if ofps else 0.0,
        **st,
    }
    if eff_fps:
        plan["out_fps_rat"] = f"{int(eff_fps)}/1"  # 60fps 목표는 정수 유리수로 고정
    elif meta.get("fps_rat"):
        plan["out_fps_rat"] = out_fps_rat(str(meta["fps_rat"]), speed, interp)
    return plan
