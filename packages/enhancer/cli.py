"""flay-enhance CLI — 화질 개선 워커 진입점.

API 라우터가 서브프로세스로 실행: `python -m packages.enhancer.cli run <job_id>`.
개발 검증용 인라인 실행: `... local <파일> [업스케일] [배속] [보간] [모델]`
(stabilizer 와 동일하게 argv 직접 파싱.)
"""

from __future__ import annotations

import logging
import sys


def _local(args: list[str]) -> None:
    """로컬 파일로 잡을 만들어 인라인 실행(end-to-end 검증용).

    usage: local <file> [none|2x|4k] [1|0.5|0.25] [off|smooth] [photo|anime]
    """
    import shutil
    from pathlib import Path

    from . import job as J
    from .config import enhance_config
    from .pipeline import run_job

    src = Path(args[0])
    if not src.exists():
        sys.stderr.write(f"input not found: {src}\n")
        sys.exit(2)
    cfg = enhance_config()
    params = {
        "upscale": args[1] if len(args) > 1 else cfg["default_upscale"],
        "speed": float(args[2]) if len(args) > 2 else float(cfg["default_speed"]),
        "interpolate": args[3] if len(args) > 3 else cfg["default_interpolate"],
        "model": args[4] if len(args) > 4 else cfg["default_model"],
    }
    job_id = J.new_job(params)
    shutil.copy2(src, J.input_path(job_id))
    sys.stderr.write(f"job {job_id} -> {J.job_path(job_id)}\n")
    run_job(job_id)
    st = J.get_status(job_id) or {}
    sys.stderr.write(f"status={st.get('status')} error={st.get('error')}\n")
    if st.get("status") == "done":
        sys.stderr.write(f"output: {J.job_path(job_id) / 'out.mp4'}\n")


def main(argv: list[str] | None = None) -> None:
    argv = sys.argv[1:] if argv is None else argv
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stderr,
    )
    if len(argv) >= 2 and argv[0] == "run":
        from packages.enhancer.pipeline import run_job
        run_job(argv[1])
        return
    if len(argv) >= 2 and argv[0] == "local":
        _local(argv[1:])
        return
    if argv and argv[0] == "cleanup":
        from packages.enhancer.job import cleanup_old_jobs
        n = cleanup_old_jobs()
        sys.stderr.write(f"removed {n} old job(s)\n")
        return
    sys.stderr.write(
        "usage: python -m packages.enhancer.cli run <job_id>\n"
        "     | local <file> [none|2x|4k] [1|0.5|0.25] [off|smooth] [photo|anime]\n"
        "     | cleanup\n")
    sys.exit(2)


if __name__ == "__main__":
    main()
