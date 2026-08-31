"""showcase 잡 모델 + 설정 단위 테스트 (ffmpeg 불필요)."""

from __future__ import annotations

from packages.showcase import job as J
from packages.showcase.config import showcase_config
from packages.showcase.pipeline import _region_crop


def test_region_crop():
    # 세로 4K(2160x3840) 표시 프레임에서 중앙 절반 구역
    assert _region_crop({"x": 0.25, "y": 0.25, "w": 0.5, "h": 0.5}, 2160, 3840) \
        == "crop=1080:1920:540:960"
    # 경계 밖으로 나가는 값은 프레임 안으로 보정
    assert _region_crop({"x": 0.9, "y": 0.9, "w": 0.5, "h": 0.5}, 2160, 3840) \
        == "crop=240:384:1920:3456"
    # 초소형 구역은 최소 240px 보장
    f = _region_crop({"x": 0.5, "y": 0.5, "w": 0.01, "h": 0.01}, 2160, 3840)
    assert f.startswith("crop=240:240:")


def test_config_defaults():
    c = showcase_config()
    assert c["work_dir"]
    assert float(c["max_clip_seconds"]) > 0
    assert 0 < int(c["trim_crf"]) < 30  # 시각적 무손실 범위


def test_job_status_roundtrip(tmp_path, monkeypatch):
    # work_dir 를 tmp 로 격리(실제 data/showcase 오염 방지)
    monkeypatch.setattr(J, "_work_root", lambda: tmp_path)

    params = {"start": 2.0, "end": 6.0, "strength": "smooth", "edge": "crop"}
    job_id = J.new_job(params)
    st = J.get_status(job_id)
    assert st is not None
    assert st["status"] == "queued"
    assert st["params"] == params
    assert st["stab_job"] is None and st["enh_job"] is None

    J.set_status(job_id, status="running", progress=30, stage="stabilize",
                 stab_job="abc123")
    st2 = J.get_status(job_id)
    assert st2["progress"] == 30
    assert st2["stage"] == "stabilize"
    assert st2["stab_job"] == "abc123"

    jobs = J.list_jobs()
    assert any(j["job_id"] == job_id for j in jobs)


def test_get_status_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(J, "_work_root", lambda: tmp_path)
    assert J.get_status("nope") is None


def test_cleanup_old_jobs(tmp_path, monkeypatch):
    import time

    monkeypatch.setattr(J, "_work_root", lambda: tmp_path)

    def backdate(job_id, hours):
        st = J.get_status(job_id)
        st["updated_at"] = time.time() - hours * 3600
        J._write(job_id, st)

    old = J.new_job({"start": 0, "end": 3})
    J.set_status(old, status="done")
    backdate(old, 100)

    recent = J.new_job({"start": 0, "end": 3})
    J.set_status(recent, status="done")  # 방금 → 보존

    running = J.new_job({"start": 0, "end": 3})
    J.set_status(running, status="running")
    backdate(running, 100)  # 오래됐지만 진행 중 → 보존

    removed = J.cleanup_old_jobs(retain_hours=48)
    assert removed == 1
    assert J.get_status(old) is None
    assert J.get_status(recent) is not None
    assert J.get_status(running) is not None
