"""이미지 -> 멀티 해상도 ICO 변환 코어 라이브러리.

원본 검증 스크립트(make_round_ico.py)의 로직을 라이브러리화하면서 다음을 개선했다:
- feather(가장자리 페더) 마스크를 numpy 로 벡터화(픽셀 단위 파이썬 루프 제거)
- round/feather 외에 square(정사각)/rounded(둥근사각) 마스크 추가
- 입력 검증(파일 크기, 디코딩 가능 여부, 압축폭탄 방지)과
  EXIF 회전만 반영 후 메타데이터 제거
- BytesIO 입출력(디스크 미사용) — 웹에서 그대로 스트리밍

CLI 와 웹(apps/api/routers/ico.py)의 공용 진입점은 convert_to_ico().
"""

from __future__ import annotations

import io
from collections.abc import Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageOps

# ICO 파일에 담을 해상도들(큰 것부터). 한 파일에 여러 장 포함된다.
ICON_SIZES: tuple[int, ...] = (256, 128, 64, 48, 32, 16)

# 지원하는 마스크 모드.
MODES: tuple[str, ...] = ("round", "feather", "square", "rounded")

# 입력 검증 한계.
MAX_BYTES = 10 * 1024 * 1024  # 업로드 파일 크기 상한 10MB
MAX_PIXELS = 50_000_000  # 디코딩 후 픽셀 수 상한(압축폭탄 방지)


class IcoError(ValueError):
    """입력 검증 실패 등 변환 불가 사유(웹에서 400 으로 변환)."""


def _square_box(w: int, h: int, side: int, anchor: str) -> tuple[int, int, int, int]:
    """정사각 크롭 박스. anchor 는 '잘려나가는 축'에만 적용된다.

    세로로 긴 이미지(h>w)는 세로를 자르므로 top/center/bottom = 위/중앙/아래,
    가로로 긴 이미지(w>h)는 가로를 자르므로 top/center/bottom = 왼쪽/중앙/오른쪽.
    정사각(w==h)은 버릴 영역이 없어 anchor 와 무관하게 (0, 0) 기준.
    """

    def offset(extent: int) -> int:
        if anchor == "top":
            return 0
        if anchor == "bottom":
            return extent - side
        return (extent - side) // 2

    if h >= w:  # 세로(또는 정사각)를 자른다 -> 가로는 항상 중앙
        left = (w - side) // 2
        top = offset(h)
    else:  # 가로를 자른다 -> 세로는 항상 중앙
        left = offset(w)
        top = (h - side) // 2
    return (left, top, left + side, top + side)


def center_square(img: Image.Image, anchor: str = "center") -> Image.Image:
    """이미지를 정사각형으로 크롭한다(min(w,h) 기준, anchor 로 잘리는 축 위치 선택)."""
    w, h = img.size
    side = min(w, h)
    return img.crop(_square_box(w, h, side, anchor))


def round_mask(size: int, supersample: int = 4) -> Image.Image:
    """또렷한 원형 마스크. 계단현상 방지를 위해 슈퍼샘플링 후 축소."""
    ss = size * supersample
    mask = Image.new("L", (ss, ss), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, ss - 1, ss - 1), fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def rounded_mask(size: int, radius: float = 0.2, supersample: int = 4) -> Image.Image:
    """둥근 사각형 마스크. radius 는 변 길이 대비 모서리 반경 비율(0.0~0.5)."""
    radius = max(0.0, min(0.5, radius))
    ss = size * supersample
    r = int(round(ss * radius))
    mask = Image.new("L", (ss, ss), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, ss - 1, ss - 1), radius=r, fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def feather_mask(size: int, feather: float = 0.18) -> Image.Image:
    """가장자리가 점점 투명해지는 방사형 그라디언트 마스크(numpy 벡터화).

    중심에서 (1-feather)*R 까지는 불투명(255), 그 바깥부터 원 둘레(R)까지
    선형으로 0 까지 감소. 원본 스크립트의 픽셀 루프와 동일한 결과(반올림 오차 ±1).
    """
    feather = max(0.0, min(0.5, feather))
    c = (size - 1) / 2.0
    radius = size / 2.0
    inner = radius * (1.0 - feather)
    ys, xs = np.ogrid[0:size, 0:size]
    dist = np.hypot(xs - c, ys - c)
    if radius > inner:
        alpha = np.clip((radius - dist) / (radius - inner), 0.0, 1.0)
    else:  # feather 0 -> 사실상 또렷한 원
        alpha = (dist <= radius).astype(np.float64)
    arr = (alpha * 255.0 + 0.5).astype(np.uint8)
    return Image.fromarray(arr, mode="L")


def _mask_for(size: int, mode: str, feather: float, radius: float) -> Image.Image | None:
    """모드별 알파 마스크. square 는 마스크 없음(전체 불투명)을 뜻해 None 반환."""
    if mode == "feather":
        return feather_mask(size, feather)
    if mode == "rounded":
        return rounded_mask(size, radius)
    if mode == "square":
        return None
    return round_mask(size)


def make_frame(
    src_square: Image.Image,
    size: int,
    mode: str,
    feather: float,
    radius: float,
) -> Image.Image:
    """주어진 해상도의 투명 처리된 RGBA 프레임 1장 생성."""
    im = src_square.resize((size, size), Image.Resampling.LANCZOS)
    mask = _mask_for(size, mode, feather, radius)
    if mask is None:  # square: 마스크 없이 그대로
        return im.convert("RGBA")
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def _normalize_sizes(sizes: Iterable[int] | None) -> list[int]:
    """요청 해상도를 허용 목록으로 정규화(중복 제거, 큰 것부터). 비면 6종 전부."""
    if not sizes:
        return list(ICON_SIZES)
    out = sorted({int(s) for s in sizes if int(s) in ICON_SIZES}, reverse=True)
    if not out:
        raise IcoError(f"유효한 해상도가 없습니다(허용: {ICON_SIZES})")
    return out


def convert_to_ico(
    data: bytes,
    *,
    mode: str = "round",
    feather: float = 0.18,
    radius: float = 0.2,
    sizes: Iterable[int] | None = None,
    anchor: str = "center",
) -> bytes:
    """이미지 바이트를 멀티 해상도 ICO 바이트로 변환한다.

    Args:
        data: 원본 이미지 바이트(jpg/png/webp 등).
        mode: round | feather | square | rounded.
        feather: feather 모드의 흐림 강도(0.0~0.5).
        radius: rounded 모드의 모서리 반경 비율(0.0~0.5).
        sizes: 포함할 해상도 부분집합(None 이면 ICON_SIZES 전부).
        anchor: 정사각 크롭 위치(center | top | bottom). 잘려나가는 축에만 적용된다
            (세로형=위/중앙/아래, 가로형=왼쪽/중앙/오른쪽, 정사각=무관).

    Raises:
        IcoError: 입력 검증 실패(모드/크기/디코딩/해상도).
    """
    if mode not in MODES:
        raise IcoError(f"mode 는 {MODES} 중 하나여야 합니다: {mode!r}")
    if len(data) > MAX_BYTES:
        raise IcoError(f"파일이 너무 큽니다(최대 {MAX_BYTES // (1024 * 1024)}MB)")
    norm_sizes = _normalize_sizes(sizes)

    try:
        src = Image.open(io.BytesIO(data))
    except Exception as e:  # noqa: BLE001 — 디코딩 불가 통합 처리
        raise IcoError(f"이미지를 디코딩할 수 없습니다: {e}") from e
    w, h = src.size  # 헤더 기준(완전 디코딩 전) — 압축폭탄 선제 차단
    if w * h > MAX_PIXELS:
        raise IcoError("이미지 해상도가 너무 큽니다")
    try:
        src.load()  # 실제 픽셀 디코딩 강제(손상 파일 검출)
    except Exception as e:  # noqa: BLE001
        raise IcoError(f"이미지 디코딩 실패: {e}") from e

    # EXIF 방향만 반영하고 RGBA 로 변환(이 과정에서 메타데이터는 버려진다).
    src = ImageOps.exif_transpose(src) or src
    src = src.convert("RGBA")
    src = center_square(src, anchor)

    frames = [make_frame(src, s, mode, feather, radius) for s in norm_sizes]
    buf = io.BytesIO()
    frames[0].save(
        buf,
        format="ICO",
        sizes=[(s, s) for s in norm_sizes],
        append_images=frames[1:],
    )
    return buf.getvalue()
