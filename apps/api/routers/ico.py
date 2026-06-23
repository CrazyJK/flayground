"""ICO 변환 라우터 — 이미지 업로드 -> 멀티 해상도 .ico 즉시 반환(동기).

stabilize/subtitle 과 달리 ICO 변환은 초단위 CPU 작업이라 잡/폴링 구조 없이
동기로 처리한다. 변환 본체는 packages.icogen.core 가 담당(CLI 공용).
변환은 이벤트 루프를 막지 않도록 asyncio.to_thread 로 워커 스레드에서 실행.

엔드포인트(prefix=/api/ico):
  POST /convert   (multipart: file + 폼 옵션) -> image/x-icon 바이너리
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response

from packages.icogen.core import MAX_BYTES, IcoError, convert_to_ico

router = APIRouter(prefix="/api/ico", tags=["ico"])
log = logging.getLogger(__name__)


def _localhost_only(request: Request) -> None:
    client_host = request.client.host if request.client else ""
    if client_host not in ("127.0.0.1", "localhost", "::1", "ai.kamoru.jk"):
        raise HTTPException(403, "ico endpoints are localhost-only")


def _parse_sizes(raw: str | None) -> list[int] | None:
    """"256,128,32" 형태의 폼 값을 정수 리스트로. 비면 None(=전체)."""
    if not raw:
        return None
    out = [int(tok) for tok in raw.replace(" ", "").split(",") if tok.isdigit()]
    return out or None


@router.post("/convert")
async def convert(
    request: Request,
    file: UploadFile = File(...),
    radius: float = Form(0.5),  # 모서리 둥글기 0.0(각진 사각)~0.5(원형)
    feather: float = Form(0.0),  # 가장자리 페더 0.0(또렷)~0.5(부드럽게)
    anchor: str = Form("center"),  # 정사각 크롭 위치 center | top | bottom
    sizes: str | None = Form(None),  # "256,128,..." (생략 시 6종 전부)
) -> Response:
    _localhost_only(request)
    data = await file.read()
    await file.close()
    if not data:
        raise HTTPException(400, "빈 파일입니다")
    if len(data) > MAX_BYTES:
        raise HTTPException(400, f"파일이 너무 큽니다(최대 {MAX_BYTES // (1024 * 1024)}MB)")

    try:
        ico = await asyncio.to_thread(
            convert_to_ico,
            data,
            radius=radius,
            feather=feather,
            sizes=_parse_sizes(sizes),
            anchor=anchor,
        )
    except IcoError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:  # noqa: BLE001 — 예기치 못한 변환 실패
        log.exception("ico convert failed: %s", e)
        raise HTTPException(500, "변환 실패") from e

    return Response(
        content=ico,
        media_type="image/x-icon",
        headers={"Content-Disposition": 'attachment; filename="icon.ico"'},
    )
