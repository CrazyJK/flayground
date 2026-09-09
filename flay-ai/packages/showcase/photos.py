"""베스트 사진 추출 — 구간 프레임을 선명도로 점수 매겨 상위 N장을 고르고 업스케일한다.

디스크 폭증을 피하기 위해 두 단계로 나눈다:
  1) 점수: 영상을 순서대로 디코딩(cv2)해 다운스케일 그레이의 라플라시안 분산(선명도)과
     하이라이트 클리핑 비율(과노출)만 계산 — 프레임을 저장하지 않는다.
  2) 추출: 선택된 프레임 번호만 ffmpeg select 필터로 PNG 추출 → (옵션) Real-ESRGAN 업스케일.

선별(select_best)은 순수 함수 — 단위 테스트 대상.
"""

from __future__ import annotations

import logging
import subprocess
import zipfile
from collections.abc import Callable
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

# 점수 계산용 다운스케일 가로(px) — 선명도 비교는 상대값이라 해상도를 낮춰도 순위가 유지된다
_SCORE_WIDTH = 720
# 하이라이트 클리핑(밝기>=250) 비율이 이 값을 넘으면 '날아간' 컷으로 제외
_MAX_BLOWN = 0.10


def score_video(path: Path, on_progress: Callable[[float], None] | None = None
                ) -> list[tuple[int, float, float]]:
    """영상의 모든 프레임에 (프레임번호, 선명도, 과노출비율)을 매긴다.

    Args:
        path: 입력 영상(트림본).
        on_progress: 0~1 진행 콜백(선택).

    Returns:
        [(idx, sharpness, blown_ratio)] — 디코딩 순서.
    """
    import cv2
    import numpy as np

    cap = cv2.VideoCapture(str(path))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    out: list[tuple[int, float, float]] = []
    i = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            h, w = frame.shape[:2]
            if w > _SCORE_WIDTH:
                frame = cv2.resize(frame, (_SCORE_WIDTH, max(int(h * _SCORE_WIDTH / w), 1)),
                                   interpolation=cv2.INTER_AREA)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            sharp = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            blown = float(np.count_nonzero(gray >= 250)) / gray.size
            out.append((i, sharp, blown))
            i += 1
            if on_progress and total and i % 20 == 0:
                on_progress(i / total)
    finally:
        cap.release()
    return out


def select_best(scored: list[tuple[int, float, float]], n: int, min_gap: int,
                max_blown: float = _MAX_BLOWN) -> list[tuple[int, float, float]]:
    """선명도 상위 N장을 고른다 — 서로 min_gap 프레임 이상 떨어진 것만(근접 중복 배제).

    과노출(blown > max_blown) 프레임은 제외하되, 전부 제외되면 과노출 기준을 무시한다.

    Args:
        scored: score_video 결과.
        n: 고를 장수(>=1).
        min_gap: 선택 프레임 간 최소 간격(프레임 수, 0이면 제한 없음).
        max_blown: 과노출 허용 상한(0~1).

    Returns:
        선택된 [(idx, sharpness, blown)] — 시간순.
    """
    if n <= 0 or not scored:
        return []
    cand = [s for s in scored if s[2] <= max_blown] or list(scored)
    cand.sort(key=lambda s: s[1], reverse=True)
    chosen: list[tuple[int, float, float]] = []
    for s in cand:
        if all(abs(s[0] - c[0]) >= min_gap for c in chosen):
            chosen.append(s)
            if len(chosen) >= n:
                break
    chosen.sort(key=lambda s: s[0])
    return chosen


def extract_frames(ffmpeg: str, src: Path, indices: list[int], out_dir: Path) -> list[Path]:
    """선택된 프레임 번호만 PNG 로 추출한다(ffmpeg select, 한 번의 디코딩).

    Returns:
        추출된 파일 경로 목록(indices 순서, `f_%08d.png` = 프레임 번호).
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    expr = "+".join(f"eq(n\\,{i})" for i in indices)
    # 파일명에 원본 프레임 번호를 남기기 위해 frame_pts 대신 순번 매핑을 쓴다(select 는 순서를 보존)
    cmd = [ffmpeg, "-hide_banner", "-v", "error", "-y", "-i", str(src),
           "-vf", f"select='{expr}'", "-vsync", "0", "-frames:v", str(len(indices)),
           str(out_dir / "sel_%03d.png")]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"프레임 추출 실패: {(p.stderr or '')[-400:]}")
    files = sorted(out_dir.glob("sel_*.png"))
    if len(files) != len(indices):
        raise RuntimeError(f"추출 프레임수 불일치: {len(files)}/{len(indices)}")
    named: list[Path] = []
    for f, idx in zip(files, indices, strict=True):
        dst = out_dir / f"f_{idx:08d}.png"
        f.rename(dst)
        named.append(dst)
    return named


def upscale_photos(cfg_enh: dict[str, Any], src_dir: Path, dst_dir: Path, upscale: str,
                   model: str, logf: Path) -> None:
    """Real-ESRGAN x4 로 폴더를 업스케일한 뒤 목표 배율(2x / 4k)로 리사이즈한다.

    Args:
        cfg_enh: enhance_config() — 바이너리·모델 경로.
        src_dir: 원본 PNG 폴더. dst_dir: 결과 폴더(같은 파일명).
        upscale: "2x" | "4k"(짧은 변 2160, 긴 변 4096 상한). "none" 이면 호출하지 않는다.
        model: photo | anime.
        logf: ncnn stderr 로그 파일.
    """
    import cv2

    from packages.enhancer.plan import encode_size

    dst_dir.mkdir(parents=True, exist_ok=True)
    bin_ = Path(cfg_enh["realesrgan_bin"])
    model_name = cfg_enh["esrgan_models"].get(model, model)
    x4 = dst_dir.parent / "photos_x4"
    x4.mkdir(parents=True, exist_ok=True)
    cmd = [str(bin_), "-i", str(src_dir), "-o", str(x4), "-n", model_name, "-s", "4",
           "-f", "png", "-m", str(bin_.parent / "models")]
    with logf.open("ab") as lf:
        lf.write(("$ " + " ".join(cmd) + "\n").encode("utf-8", "replace"))
        rc = subprocess.run(cmd, stdout=lf, stderr=lf).returncode
    if rc != 0:
        raise RuntimeError(f"업스케일 실패(exit {rc}) — logs/upscale.log 참고")
    for f in sorted(src_dir.glob("*.png")):
        up = x4 / f.name
        img = cv2.imread(str(up), cv2.IMREAD_COLOR)
        if img is None:
            raise RuntimeError(f"업스케일 산출물 없음: {up.name}")
        h4, w4 = img.shape[:2]
        tw, th = encode_size(w4 // 4, h4 // 4, upscale)
        if (tw, th) != (w4, h4):
            img = cv2.resize(img, (tw, th), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(dst_dir / f.name), img)


def zip_dir(src_dir: Path, zip_path: Path) -> None:
    """폴더의 PNG 를 ZIP(무압축·PNG 는 이미 압축됨)으로 묶는다."""
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_STORED) as zf:
        for f in sorted(src_dir.glob("*.png")):
            zf.write(f, f.name)
