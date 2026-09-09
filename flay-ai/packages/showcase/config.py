"""연출 클립 설정 — config.yaml 의 `showcase:` 블록 + 기본값 병합.

yaml 블록이 없거나 일부만 있어도 동작하도록 코드 기본값을 깐다.
안정화·화질 개선의 세부 설정은 각 패키지(stabilize:/enhance: 블록)를 따르고
여기에 중복하지 않는다 — showcase 는 체인 고유 값만 가진다.
"""

from __future__ import annotations

from typing import Any

from packages.settings import load_config

_DEFAULTS: dict[str, Any] = {
    "work_dir": "data/showcase",
    "ffmpeg": "ffmpeg",
    "ffprobe": "ffprobe",
    "max_clip_seconds": 10,   # 트림 구간 상한(초) — 업스케일 비용이 프레임당 초 단위
    "max_photo_seconds": 60,  # 사진 출력 모드 구간 상한(초) — 전 프레임 디코딩·점수 계산 시간
    "trim_crf": 12,           # 트림 중간본 x264 CRF(시각적 무손실 수준)
    "retain_hours": 72,
}


def showcase_config() -> dict[str, Any]:
    """병합된 연출 클립 설정 dict.

    Returns:
        기본값 위에 config.yaml `showcase:` 블록을 덮어쓴 설정.
    """
    try:
        raw = load_config().get("showcase") or {}
    except FileNotFoundError:
        raw = {}
    merged = dict(_DEFAULTS)
    merged.update(raw)
    return merged
