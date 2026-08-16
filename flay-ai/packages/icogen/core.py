"""이미지 -> 멀티 해상도 ICO 변환 코어 라이브러리.

원본 검증 스크립트(make_round_ico.py)의 로직을 라이브러리화하면서, 4개 모드
(round/feather/square/rounded)를 직교하는 연속 파라미터 2개로 통합했다:

- radius(모서리 둥글기): 0.0=각진 사각 ~ 0.5=완전한 원 (CSS border-radius 와 동일 개념)
- feather(가장자리 페더): 0.0=또렷 ~ 0.5=부드럽게

둥근 사각형의 부호거리장(SDF, signed distance field) 하나로 두 효과를 동시에
계산하므로 모드 분기가 없다. 기존 모드는 (radius, feather) 조합으로 환원된다:
원형=(0.5, 0), 사각=(0, 0), 둥근사각=(r, 0), 부드러운 원=(0.5, f).
부드러운 둥근사각/사각 같은 새 조합도 자연스럽게 표현된다.

그 밖의 개선: 입력 검증(파일 크기/디코딩/압축폭탄), EXIF 회전만 반영 후 메타
제거, BytesIO 입출력. CLI 와 웹(apps/api/routers/ico.py)의 공용 진입점은
convert_to_ico().
"""

from __future__ import annotations

import io
from collections.abc import Iterable

import numpy as np
from PIL import Image, ImageOps

# ICO 파일에 담을 해상도들(큰 것부터). 한 파일에 여러 장 포함된다.
ICON_SIZES: tuple[int, ...] = (256, 128, 64, 48, 32, 16)

# 입력 검증 한계.
MAX_BYTES = 10 * 1024 * 1024  # 업로드 파일 크기 상한 10MB
MAX_PIXELS = 50_000_000  # 디코딩 후 픽셀 수 상한(압축폭탄 방지)


class IcoError(ValueError):
    """입력 검증 실패 등 변환 불가 사유(웹에서 400 으로 변환)."""


def _crop_box(w: int, h: int, zoom: float, offx: float, offy: float) -> tuple[int, int, int, int]:
    """원본에서 잘라낼 정사각 영역(box). zoom 으로 크기, offx/offy 로 위치 지정.

    - zoom=1.0: 짧은 변이 꽉 차는 정사각(=cover, 기존 center 크롭과 동일).
      zoom>1 확대(더 좁게 크롭 → 피사체 크게), zoom<1 축소(영역이 원본보다
      커져 가장자리는 투명 패딩).
    - offx/offy: -1~1, 0=가운데. 여유 공간(슬랙) 안에서 좌우/상하로 이동.
      비정사각이면 긴 축에 슬랙이 생겨 기존 anchor(위/중앙/아래)를 대체한다.

    화질: 영역(side)은 원본 픽셀 기준이라, 각 ICO 해상도로 리샘플할 때 항상
    원본에서 직접 다운샘플된다(축소본 재확대 없음).
    """
    zoom = max(0.1, min(10.0, zoom))
    offx = max(-1.0, min(1.0, offx))
    offy = max(-1.0, min(1.0, offy))
    side = min(w, h) / zoom
    left = (w - side) / 2.0 * (1.0 + offx)  # 슬랙(w-side)>0 일 때만 실제 이동
    top = (h - side) / 2.0 * (1.0 + offy)
    s = max(1, int(round(side)))
    li, ti = int(round(left)), int(round(top))
    return (li, ti, li + s, ti + s)


def crop_square(
    img: Image.Image, zoom: float = 1.0, offx: float = 0.0, offy: float = 0.0
) -> Image.Image:
    """원본을 정사각으로 크롭한다(zoom/offx/offy). 영역이 원본을 벗어나면 투명 패딩.

    RGBA 이미지를 가정한다 — 범위 밖 crop 영역은 (0,0,0,0)으로 채워진다.
    """
    w, h = img.size
    return img.crop(_crop_box(w, h, zoom, offx, offy))


def shape_mask(size: int, radius: float = 0.5, feather: float = 0.0) -> Image.Image:
    """둥근 사각형(반경 radius) + 가장자리 페더(feather)를 한 번에 표현하는 알파 마스크.

    radius: 모서리 반경 비율 0.0(각진 사각) ~ 0.5(완전한 원). 변 길이 대비.
    feather: 가장자리 페더 비율 0.0(또렷) ~ 0.5(부드럽게). 반지름 R 대비 흐림 폭.

    둥근 사각형 SDF(inigo quilez)로 경계까지의 부호거리 d 를 구해(<0 내부, >0 외부),
    feather=0 이면 1px 안티에일리어싱 또렷한 경계, feather>0 이면 경계 안쪽
    feather*R 폭에서 1->0 으로 선형 감쇠시킨다. radius=0.5 이면 원, 0 이면 사각.
    """
    radius = max(0.0, min(0.5, radius))
    feather = max(0.0, min(0.5, feather))
    r = radius * size  # 모서리 반경(px). size/2 이면 반쪽변이라 완전한 원이 된다.
    half = size / 2.0  # 정사각 반변(=원의 반지름 R)
    c = (size - 1) / 2.0  # 픽셀 좌표계 중심
    ys, xs = np.ogrid[0:size, 0:size]
    px = np.abs(xs - c)
    py = np.abs(ys - c)
    # 둥근 사각형 SDF: q = |p| - half + r;  d = |max(q,0)| + min(max(qx,qy),0) - r
    qx = px - half + r
    qy = py - half + r
    outside = np.hypot(np.maximum(qx, 0.0), np.maximum(qy, 0.0))
    inside = np.minimum(np.maximum(qx, qy), 0.0)
    dist = outside + inside - r
    if feather > 0:
        alpha = np.clip(-dist / (feather * half), 0.0, 1.0)
    else:
        alpha = np.clip(0.5 - dist, 0.0, 1.0)  # 1px 안티에일리어싱(또렷한 경계)
    arr = (alpha * 255.0 + 0.5).astype(np.uint8)
    return Image.fromarray(arr, mode="L")


def make_frame(src_square: Image.Image, size: int, radius: float, feather: float) -> Image.Image:
    """주어진 해상도의 투명 처리된 RGBA 프레임 1장 생성."""
    im = src_square.resize((size, size), Image.Resampling.LANCZOS)
    mask = shape_mask(size, radius, feather)
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
    radius: float = 0.5,
    feather: float = 0.0,
    zoom: float = 1.0,
    offx: float = 0.0,
    offy: float = 0.0,
    sizes: Iterable[int] | None = None,
) -> bytes:
    """이미지 바이트를 멀티 해상도 ICO 바이트로 변환한다.

    Args:
        data: 원본 이미지 바이트(jpg/png/webp 등).
        radius: 모서리 둥글기 0.0(각진 사각) ~ 0.5(완전한 원).
        feather: 가장자리 페더 0.0(또렷) ~ 0.5(부드럽게).
        zoom: 확대/축소 배율. 1.0=짧은 변 꽉 참, >1 확대, <1 축소(투명 패딩).
        offx: 가로 위치 -1~1(0=가운데). 슬랙 안에서 좌우 이동.
        offy: 세로 위치 -1~1(0=가운데). 슬랙 안에서 상하 이동.
        sizes: 포함할 해상도 부분집합(None 이면 ICON_SIZES 전부).

    Raises:
        IcoError: 입력 검증 실패(크기/디코딩/해상도).
    """
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
    src = crop_square(src, zoom, offx, offy)

    frames = [make_frame(src, s, radius, feather) for s in norm_sizes]
    buf = io.BytesIO()
    frames[0].save(
        buf,
        format="ICO",
        sizes=[(s, s) for s in norm_sizes],
        append_images=frames[1:],
    )
    return buf.getvalue()
