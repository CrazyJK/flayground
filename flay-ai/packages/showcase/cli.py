"""flay-showcase CLI — 연출 클립 워커 진입점.

API 라우터가 서브프로세스로 실행: `python -m packages.showcase.cli run <job_id>`.
개발 검증용 인라인 실행: `... local <파일> <시작초> <끝초> [strength] [edge]`
(stabilizer/enhancer 와 동일하게 argv 직접 파싱.)
"""

from __future__ import annotations

import logging
import sys


def _local(args: list[str]) -> None:
    """로컬 파일로 잡을 만들어 인라인 실행(end-to-end 검증용).

    usage: local <file> <start> <end> [dejitter|smooth|lock] [crop|blur|black] [x,y,w,h]
    안정화는 person 모드(주인공 자동 지정), 화질은 4k·0.5배·smooth 기본.
    x,y,w,h 는 처리 구역(0~1 상대 사각형) — 지정 시 그 구역만 잘라 처리.
    """
    import shutil
    from pathlib import Path

    from . import job as J
    from .pipeline import run_job

    if len(args) < 3:
        sys.stderr.write("usage: local <file> <start> <end> [strength] [edge] [x,y,w,h]\n")
        sys.exit(2)
    src = Path(args[0])
    if not src.exists():
        sys.stderr.write(f"input not found: {src}\n")
        sys.exit(2)
    params = {
        "start": float(args[1]), "end": float(args[2]),
        "mode": "person",
        "strength": args[3] if len(args) > 3 else "smooth",
        "edge": args[4] if len(args) > 4 else "crop",
        "upscale": "4k", "speed": 0.5, "interpolate": "smooth",
        "model": "photo", "fps": 0,
    }
    if len(args) > 5:
        x, y, w, h = (float(v) for v in args[5].split(","))
        params["region"] = {"x": x, "y": y, "w": w, "h": h}
    job_id = J.new_job(params)
    shutil.copy2(src, J.input_path(job_id))
    sys.stderr.write(f"job {job_id} -> {J.job_path(job_id)}\n")
    run_job(job_id)
    st = J.get_status(job_id) or {}
    sys.stderr.write(f"status={st.get('status')} error={st.get('error')}\n")
    if st.get("status") == "done":
        sys.stderr.write(f"output: {J.job_path(job_id) / 'out.mp4'}\n")


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
        "     | local <file> <start> <end> [dejitter|smooth|lock] [crop|blur|black]\n"
        "     | cleanup\n")
    sys.exit(2)


if __name__ == "__main__":
    main()
