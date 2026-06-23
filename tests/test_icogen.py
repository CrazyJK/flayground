"""packages.icogen.core 변환 로직 테스트(통합 둥글기/페더 모델)."""

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
    shape_mask,
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


# --- 모양: 둥글기/페더 조합 -----------------------------------------


def test_circle_contains_all_sizes_and_is_round():
    ico = convert_to_ico(_png_bytes(), radius=0.5, feather=0.0)
    avail = Image.open(io.BytesIO(ico)).ico.sizes()
    assert avail == {(s, s) for s in ICON_SIZES}

    big = _frame(ico, 256)
    assert _alpha(big, 128, 128) == 255  # 중앙 불투명
    assert _alpha(big, 1, 1) == 0  # 모서리 투명(원 바깥)


def test_square_keeps_corners_opaque():
    ico = convert_to_ico(_png_bytes(), radius=0.0, feather=0.0)
    big = _frame(ico, 256)
    assert _alpha(big, 1, 1) == 255  # 각진 사각 — 모서리도 불투명
    assert _alpha(big, 128, 128) == 255


def test_rounded_clips_corners_only():
    ico = convert_to_ico(_png_bytes(), radius=0.3, feather=0.0)
    big = _frame(ico, 256)
    assert _alpha(big, 0, 0) == 0  # 모서리는 깎임
    assert _alpha(big, 128, 128) == 255  # 중앙 불투명
    assert _alpha(big, 128, 0) == 255  # 변 중앙은 살아있음


def test_feather_soft_circle_has_soft_edge():
    ico = convert_to_ico(_png_bytes(), radius=0.5, feather=0.3)
    big = _frame(ico, 256)
    assert _alpha(big, 128, 128) == 255  # 중앙 불투명
    assert _alpha(big, 0, 0) == 0  # 모서리 투명
    edge = [_alpha(big, x, 128) for x in range(248, 256)]
    assert any(0 < a < 255 for a in edge)  # 부드러운 경계(중간 알파)


def test_soft_square_combo_is_new_and_feathers_edges():
    # 기존 4모드로는 불가능했던 조합: 각진 사각 + 가장자리 페더.
    ico = convert_to_ico(_png_bytes(), radius=0.0, feather=0.3)
    big = _frame(ico, 256)
    assert _alpha(big, 128, 128) == 255  # 중앙 불투명
    edge = [_alpha(big, 128, y) for y in range(0, 8)]
    assert any(0 < a < 255 for a in edge)  # 사각이지만 가장자리는 페더링


# --- 해상도/크롭 ----------------------------------------------------


def test_sizes_subset():
    ico = convert_to_ico(_png_bytes(), radius=0.5, sizes=[64, 32])
    avail = Image.open(io.BytesIO(ico)).ico.sizes()
    assert avail == {(64, 64), (32, 32)}


def test_anchor_top_vs_bottom_differ_portrait():
    src = _png_bytes(120, 200)  # 세로로 긴 이미지 -> 위/아래 크롭 위치가 결과를 바꾼다
    top = _frame(convert_to_ico(src, radius=0.0, anchor="top"), 64)
    bottom = _frame(convert_to_ico(src, radius=0.0, anchor="bottom"), 64)
    assert top.tobytes() != bottom.tobytes()


def test_anchor_left_vs_right_differ_landscape():
    src = _png_bytes(200, 120)  # 가로로 긴 이미지 -> top/bottom 이 좌/우 크롭으로 작동
    left = _frame(convert_to_ico(src, radius=0.0, anchor="top"), 64)
    right = _frame(convert_to_ico(src, radius=0.0, anchor="bottom"), 64)
    assert left.tobytes() != right.tobytes()


def test_anchor_noop_on_square():
    src = _png_bytes(150, 150)  # 정사각 -> 잘릴 영역이 없어 anchor 와 무관하게 동일
    a = _frame(convert_to_ico(src, radius=0.0, anchor="top"), 64)
    b = _frame(convert_to_ico(src, radius=0.0, anchor="bottom"), 64)
    assert a.tobytes() == b.tobytes()


# --- 입력 검증 ------------------------------------------------------


def test_undecodable_bytes_raise():
    with pytest.raises(IcoError):
        convert_to_ico(b"this is not an image")


def test_no_valid_sizes_raises():
    with pytest.raises(IcoError):
        convert_to_ico(_png_bytes(), sizes=[123, 999])


# --- SDF 마스크 동치성 ---------------------------------------------


def test_shape_mask_circle_feather_matches_old_radial_formula():
    """radius=0.5 의 페더가 기존 방사형 그라디언트 공식과 동일한지(반올림 오차 ±1)."""
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
    got = np.asarray(shape_mask(size, radius=0.5, feather=feather), dtype=np.int32)
    assert np.max(np.abs(got - ref)) <= 1


def test_shape_mask_extremes():
    """radius=0 -> 사각(모서리 255), radius=0.5 -> 원(모서리 0)."""
    sq = np.asarray(shape_mask(64, radius=0.0, feather=0.0))
    assert sq[0, 0] == 255 and sq[32, 32] == 255
    circ = np.asarray(shape_mask(64, radius=0.5, feather=0.0))
    assert circ[0, 0] == 0 and circ[32, 32] == 255
