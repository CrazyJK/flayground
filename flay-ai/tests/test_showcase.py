"""showcase 잡 모델 + 설정 단위 테스트 (ffmpeg 불필요)."""

from __future__ import annotations

from packages.showcase import job as J
from packages.showcase.config import showcase_config
from packages.showcase.pipeline import _region_crop, plan_stages


def test_plan_stages_combos():
    # 연출: 구간+인물 고정+화질 → 세 단계, 0→99 단조 분할, enhance 가 가장 넓음
    st = plan_stages({"start": 2, "end": 6, "stabilize": "person", "enhance": True}, 22.0)
    assert list(st) == ["trim", "stabilize", "enhance"]
    prev = 0
    for lo, hi in st.values():
        assert lo == prev and hi >= lo
        prev = hi
    assert prev == 99
    widths = {k: hi - lo for k, (lo, hi) in st.items()}
    assert widths["enhance"] == max(widths.values())
    # 안정화만(전체 구간, 구역 없음) → 트림 생략
    st2 = plan_stages({"start": 0, "end": 0, "stabilize": "background", "enhance": False}, 22.0)
    assert list(st2) == ["stabilize"] and st2["stabilize"] == (0, 99)
    # 화질만 + 구역 → 트림(크롭)은 유지
    st3 = plan_stages({"start": 0, "end": 22, "stabilize": "off", "enhance": True,
                       "region": {"x": 0, "y": 0.3, "w": 1, "h": 0.5}}, 22.0)
    assert list(st3) == ["trim", "enhance"]
    # 아무 단계도 없음 → 빈 계획(라우터가 거부)
    assert plan_stages({"start": 0, "end": 0, "stabilize": "off", "enhance": False}, 22.0) == {}
    # 구 파라미터(mode=person, enhance 미지정)도 person+enhance 로 해석
    st4 = plan_stages({"start": 2.4, "end": 7.2, "mode": "person"}, 22.0)
    assert list(st4) == ["trim", "stabilize", "enhance"]


def test_result_name():
    st = {"job_id": "827a704eb7c542ba", "params": {
        "start": 2.4, "end": 7.2, "stabilize": "person", "strength": "dejitter",
        "enhance": True, "upscale": "4k", "speed": 0.5, "interpolate": "smooth", "fps": 60,
        "region": {"x": 0, "y": 0.3, "w": 1, "h": 0.5}}}
    assert J.result_name(st) == "showcase_2.4-7.2s_person-dejitter_4k_0.5x_60fps_region_827a70.mp4"
    st2 = {"job_id": "abc123def", "params": {
        "start": 0, "end": 8, "stabilize": "background", "strength": "auto", "enhance": False}}
    assert J.result_name(st2) == "showcase_0-8s_background-auto_noenh_abc123.mp4"
    st3 = {"job_id": "ffeedd0011", "params": {
        "start": 0, "end": 0, "stabilize": "off", "enhance": True,
        "upscale": "none", "speed": 0.5, "interpolate": "off", "mute": True}}
    assert J.result_name(st3) == "showcase_0-0s_nostab_0.5x_nointerp_mute_ffeedd.mp4"


def test_region_crop():
    # 세로 4K(2160x3840) 표시 프레임에서 중앙 절반 구역
    assert _region_crop({"x": 0.25, "y": 0.25, "w": 0.5, "h": 0.5}, 2160, 3840) \
        == "crop=1080:1920:540:960"
    # 경계 밖으로 나가는 값은 프레임 안으로 보정
    assert _region_crop({"x": 0.9, "y": 0.9, "w": 0.5, "h": 0.5}, 2160, 3840) \
        == "crop=216:384:1944:3456"
    # 초소형 구역은 한 변 5% 하한(2160→108, 3840→192)
    assert _region_crop({"x": 0.5, "y": 0.5, "w": 0.01, "h": 0.01}, 2160, 3840) \
        == "crop=108:192:1080:1920"
    # 저해상도(640x360)에서도 사용자 구역이 그대로 — 절대 px 하한으로 넓어지지 않는다
    assert _region_crop({"x": 0, "y": 0.128, "w": 0.206, "h": 0.791}, 640, 360) \
        == "crop=132:284:0:46"


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
