"""화질 개선 설정 — config.yaml 의 `enhance:` 블록 + 기본값 병합.

yaml 블록이 없거나 일부만 있어도 동작하도록 코드 기본값을 깐다.
외부 바이너리(realesrgan/rife ncnn-vulkan)는 config 로만 참조한다(하드코딩 금지).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from packages.settings import load_config

# 업스케일 모델 프리셋 → realesrgan 모델 이름(바이너리 옆 models/ 폴더)
_DEFAULT_MODELS = {
    "photo": "realesrgan-x4plus",        # 실사
    "anime": "realesrgan-x4plus-anime",  # 애니메이션 소스
}

# 단계별 예상 초/프레임 — 2026-07-24 실측(RTX 4070 Ti, 1080p 입력) 기반 1차 근사
_DEFAULT_ESTIMATES = {
    "extract_spf": 0.02,   # ffmpeg 프레임 추출
    "upscale_spf": 4.5,    # Real-ESRGAN x4 (지배 비용)
    "rife_spf": 0.3,       # RIFE 4K 프레임당 생성
    "encode_spf": 0.08,    # 인코딩
}

_DEFAULTS: dict[str, Any] = {
    "work_dir": "data/enhance",
    "ffmpeg": "ffmpeg",
    "ffprobe": "ffprobe",
    "realesrgan_bin": "C:/kamoru/Apps/realesrgan/realesrgan-ncnn-vulkan.exe",
    "rife_bin": "C:/kamoru/Apps/rife/rife-ncnn-vulkan.exe",
    "rife_model": "rife-v4.6",       # -n(임의 프레임수) 지원은 v4 계열만
    "esrgan_models": dict(_DEFAULT_MODELS),
    "target_height": 2160,           # 4k 옵션 목표(짧은 변). 세로 영상은 자동 2160x3840
    "max_input_seconds": 30,         # 업스케일 비용(프레임당 초 단위) 때문에 짧게 시작
    "min_free_gb": 30,               # 중간 PNG(장당 30~50MB) 대비 시작 전 여유 검사
    "encoder": "h264_nvenc",         # 폴백 libx264 (stabilizer 와 동일 패턴)
    "retain_hours": 72,
    "default_upscale": "4k",         # none | 2x | 4k
    "default_speed": 0.5,            # 1 | 0.5 | 0.25
    "default_interpolate": "smooth",  # off | smooth
    "default_model": "photo",        # photo | anime
    "estimates": dict(_DEFAULT_ESTIMATES),
}


def enhance_config() -> dict[str, Any]:
    """병합된 화질 개선 설정 dict."""
    try:
        raw = load_config().get("enhance") or {}
    except FileNotFoundError:
        raw = {}
    merged = dict(_DEFAULTS)
    merged.update({k: v for k, v in raw.items() if k not in ("esrgan_models", "estimates")})
    models = dict(_DEFAULT_MODELS)
    models.update(raw.get("esrgan_models") or {})
    merged["esrgan_models"] = models
    est = dict(_DEFAULT_ESTIMATES)
    est.update(raw.get("estimates") or {})
    merged["estimates"] = est
    return merged


def check_binaries(cfg: dict[str, Any], model: str = "photo") -> list[str]:
    """외부 바이너리/모델 존재 검증. 문제 목록 반환(빈 리스트면 OK) — 조기 실패용."""
    problems: list[str] = []
    rb = Path(cfg["realesrgan_bin"])
    if not rb.exists():
        problems.append(
            f"realesrgan 바이너리 없음: {rb} "
            "(realesrgan-ncnn-vulkan 릴리스를 받아 해당 경로에 두세요)")
    else:
        name = cfg["esrgan_models"].get(model, model)
        mp = rb.parent / "models" / f"{name}.param"
        if not mp.exists():
            problems.append(f"realesrgan 모델 없음: {mp}")
    fb = Path(cfg["rife_bin"])
    if not fb.exists():
        problems.append(
            f"rife 바이너리 없음: {fb} "
            "(rife-ncnn-vulkan 릴리스를 받아 해당 경로에 두세요)")
    else:
        md = fb.parent / cfg["rife_model"]
        if not md.exists():
            problems.append(f"rife 모델 폴더 없음: {md}")
    return problems
