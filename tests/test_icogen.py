"""packages.icogen.core 변환 로직 테스트."""

from __future__ import annotations

import io
import math

import numpy as np
import pytest
from PIL import Image

from packages.icogen.core import (
    ICON_SIZES,
    IcoError,
    convert_to_ico,
    feather_mask,
)


def _png_bytes(w: int = 200, h: int = 120) -> bytes:
    """간단한 그라디언트 RGB PNG 바이트(불투명)."""
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    arr[..., 0] = np.linspace(0, 255, w, dtype=np.uint8)[None, :]
    arr[..., 1] = np.linspace(0, 255, h, dtype=np.uint8)[:, None]
    arr[..., 2] = 128
    buf = io.BytesIO()
    Image.fromarray(arr, "RGB").save(buf, format="PNG")
    return buf.getvalue()


def _frame(ico: bytes, size: int) -> Image.Image:
    """ICO 바이트에서 특정 해상도 프레임을 RGBA 로 추출."""
    im = Image.open(io.BytesIO(ico))
    im.size = (size, size)  # ICO 플러그인 공개 API: 원하는 해상도 선택
    im.load()
    return im.convert("RGBA")


def _alpha(im: Image.Image, x: int, y: int) -> int:
    return im.getpixel((x, y))[3]


def test_round_contains_all_sizes_and_is_round():
    ico = convert_to_ico(_png_bytes(), mode="round")
    avail = Image.open(io.BytesIO(ico)).ico.sizes()
    assert avail == {(s, s) for s in ICON_SIZES}

    big = _frame(ico, 256)
    assert _alpha(big, 128, 128) == 255  # 중앙 불투명
    assert _alpha(big, 1, 1) == 0  # 모서리 투명(원 바깥)


def test_square_keeps_corners_opaque():
    ico = convert_to_ico(_png_bytes(), mode="square")
    big = _frame(ico, 256)
    assert _alpha(big, 1, 1) == 255  # square 는 모서리도 불투명
    assert _alpha(big, 128, 128) == 255


def test_rounded_clips_corners_only():
    ico = convert_to_ico(_png_bytes(), mode="rounded", radius=0.3)
    big = _frame(ico, 256)
    assert _alpha(big, 0, 0) == 0  # 모서리는 깎임
    assert _alpha(big, 128, 128) == 255  # 중앙 불투명
    assert _alpha(big, 128, 0) == 255  # 변 중앙은 살아있음


def test_feather_has_soft_edge():
    ico = convert_to_ico(_png_bytes(), mode="feather", feather=0.3)
    big = _frame(ico, 256)
    assert _alpha(big, 128, 128) == 255  # 중앙 불투명
    assert _alpha(big, 0, 0) == 0  # 모서리 투명
    # 가장자리 근처에는 0/255 사이 중간 알파가 존재(부드러운 경계)
    edge = [_frame(ico, 256).getpixel((x, 128))[3] for x in range(248, 256)]
    assert any(0 < a < 255 for a in edge)


def test_sizes_subset():
    ico = convert_to_ico(_png_bytes(), mode="round", sizes=[64, 32])
    avail = Image.open(io.BytesIO(ico)).ico.sizes()
    assert avail == {(64, 64), (32, 32)}


def test_anchor_top_vs_bottom_differ_portrait():
    src = _png_bytes(120, 200)  # 세로로 긴 이미지 -> 위/아래 크롭 위치가 결과를 바꾼다
    top = _frame(convert_to_ico(src, mode="square", anchor="top"), 64)
    bottom = _frame(convert_to_ico(src, mode="square", anchor="bottom"), 64)
    assert top.tobytes() != bottom.tobytes()


def test_anchor_left_vs_right_differ_landscape():
    src = _png_bytes(200, 120)  # 가로로 긴 이미지 -> top/bottom 이 좌/우 크롭으로 작동
    left = _frame(convert_to_ico(src, mode="square", anchor="top"), 64)
    right = _frame(convert_to_ico(src, mode="square", anchor="bottom"), 64)
    assert left.tobytes() != right.tobytes()


def test_anchor_noop_on_square():
    src = _png_bytes(150, 150)  # 정사각 -> 잘릴 영역이 없어 anchor 와 무관하게 동일
    a = _frame(convert_to_ico(src, mode="square", anchor="top"), 64)
    b = _frame(convert_to_ico(src, mode="square", anchor="bottom"), 64)
    assert a.tobytes() == b.tobytes()


def test_invalid_mode_raises():
    with pytest.raises(IcoError):
        convert_to_ico(_png_bytes(), mode="triangle")


def test_undecodable_bytes_raise():
    with pytest.raises(IcoError):
        convert_to_ico(b"this is not an image")


def test_no_valid_sizes_raises():
    with pytest.raises(IcoError):
        convert_to_ico(_png_bytes(), sizes=[123, 999])


def test_feather_mask_matches_reference_loop():
    """벡터화 feather_mask 가 원본 픽셀 루프와 동일한지(반올림 오차 ±1)."""
    size, feather = 24, 0.3
    c = (size - 1) / 2.0
    R = size / 2.0
    inner = R * (1.0 - feather)
    ref = np.zeros((size, size), dtype=np.int32)
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - c, y - c)
            if d <= inner:
                a = 255
            elif d >= R:
                a = 0
            else:
                a = int(round(255 * (R - d) / (R - inner)))
            ref[y, x] = a
    got = np.asarray(feather_mask(size, feather), dtype=np.int32)
    assert np.max(np.abs(got - ref)) <= 1
