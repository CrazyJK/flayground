"""flay-showcase CLI — 연출 클립 워커 진입점.

API 라우터가 서브프로세스로 실행: `python -m packages.showcase.cli run <job_id>`.
개발 검증용 인라인 실행: `... local <파일> <시작초> <끝초> [strength] [edge]`
(stabilizer/enhancer 와 동일하게 argv 직접 파싱.)
"""

from __future__ import annotations

import logging
import sys

_LOCAL_USAGE = (
    "usage: local <file> <start> <end> [key=value ...]\n"
    "  keys: stabilize=off|background|person  strength=dejitter|smooth|lock|auto\n"
    "        edge=crop|blur|black  scale_lock=1  lowfps=1  mute=1\n"
    "        enhance=0|1  upscale=none|2x|4k  speed=1|0.5|0.25  interpolate=off|smooth\n"
    "        model=photo|anime  fps=0|60  region=x,y,w,h(0~1)  subject=t,x,y\n"
    "        output=video|photos  photo_n=5  photo_gap=0.3   (사진 모드: 선명 상위 N장 → PNG+ZIP)\n"
    "  start=0 end=0 이면 전체 구간(트림 생략).\n")


def _local(args: list[str]) -> None:
    """로컬 파일로 잡을 만들어 인라인 실행(end-to-end 검증용).

    기본값은 연출 클립(person·smooth·crop·4k·0.5배·smooth). key=value 로 단계·옵션을 바꿔
    안정화만(enhance=0)·화질만(stabilize=off) 조합도 검증할 수 있다.
    """
    import shutil
    from pathlib import Path

    from . import job as J
    from .pipeline import run_job

    if len(args) < 3:
        sys.stderr.write(_LOCAL_USAGE)
        sys.exit(2)
    src = Path(args[0])
    if not src.exists():
        sys.stderr.write(f"input not found: {src}\n")
        sys.exit(2)
    params: dict = {
        "start": float(args[1]), "end": float(args[2]),
        "stabilize": "person", "strength": "smooth", "edge": "crop",
        "enhance": True, "upscale": "4k", "speed": 0.5, "interpolate": "smooth",
        "model": "photo", "fps": 0,
    }
    for kv in args[3:]:
        k, _, v = kv.partition("=")
        if k == "region":
            x, y, w, h = (float(t) for t in v.split(","))
            params["region"] = {"x": x, "y": y, "w": w, "h": h}
        elif k == "subject":  # 주인공 클릭 t,x,y (원본 기준 초·상대좌표)
            t, x, y = (float(s) for s in v.split(","))
            params["subject"] = {"t": t, "x": x, "y": y}
        elif k in ("enhance", "scale_lock", "lowfps", "mute"):
            params[k] = v.lower() not in ("0", "false", "off", "no")
        elif k in ("speed", "photo_gap"):
            params[k] = float(v)
        elif k in ("fps", "photo_n"):
            params[k] = int(v)
        elif k in ("stabilize", "strength", "edge", "upscale", "interpolate", "model", "output"):
            params[k] = v
        else:
            sys.stderr.write(f"unknown option: {kv}\n{_LOCAL_USAGE}")
            sys.exit(2)
    job_id = J.new_job(params)
    shutil.copy2(src, J.input_path(job_id))
    sys.stderr.write(f"job {job_id} -> {J.job_path(job_id)}\n")
    run_job(job_id)
    st = J.get_status(job_id) or {}
    sys.stderr.write(f"status={st.get('status')} error={st.get('error')}\n")
    if st.get("status") == "done":
        main_out = "photos.zip" if params.get("output") == "photos" else "out.mp4"
        sys.stderr.write(f"output: {J.job_path(job_id) / main_out}\n")


def main(argv: list[str] | None = None) -> None:
    """argv 파싱 후 run/local/cleanup 디스패치."""
    argv = sys.argv[1:] if argv is None else argv
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stderr,
    )
    if len(argv) >= 2 and argv[0] == "run":
        from packages.showcase.pipeline import run_job
        run_job(argv[1])
        return
    if len(argv) >= 2 and argv[0] == "local":
        _local(argv[1:])
        return
    if argv and argv[0] == "cleanup":
        from packages.showcase.job import cleanup_old_jobs
        n = cleanup_old_jobs()
        sys.stderr.write(f"removed {n} old job(s)\n")
        return
    sys.stderr.write(
        "usage: python -m packages.showcase.cli run <job_id>\n"
        "     | local <file> <start> <end> [key=value ...]\n"
        "     | cleanup\n" + _LOCAL_USAGE)
    sys.exit(2)


if __name__ == "__main__":
    main()
