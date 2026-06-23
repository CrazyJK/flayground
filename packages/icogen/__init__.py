"""이미지 -> 멀티 해상도 ICO 변환 서브시스템.

핵심 라이브러리는 core.py 에 있고, 웹은 apps/api/routers/ico.py 가 감싼다.
"""

from packages.icogen.core import ICON_SIZES, MODES, IcoError, convert_to_ico

__all__ = ["ICON_SIZES", "MODES", "IcoError", "convert_to_ico"]
