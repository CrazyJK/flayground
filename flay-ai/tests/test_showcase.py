"""showcase 잡 모델 + 설정 단위 테스트 (ffmpeg 불필요)."""

from __future__ import annotations

from packages.showcase import job as J
from packages.showcase.config import showcase_config
from packages.showcase.photos import select_best
from packages.showcase.pipeline import _region_crop, plan_stages


def test_select_best():
    # (idx, sharp, blown) — 선명도 상위이면서 서로 min_gap 이상 떨어진 것만, 시간순 반환
    scored = [(0, 50, 0), (1, 90, 0), (2, 95, 0), (3, 40, 0), (10, 80, 0), (11, 85, 0), (30, 60, 0)]
    assert [s[0] for s in select_best(scored, 3, min_gap=5)] == [2, 11, 30]
    # 간격 0 이면 순수 상위 N
    assert [s[0] for s in select_best(scored, 2, min_gap=0)] == [1, 2]
    # 과노출 프레임은 제외, 전부 과노출이면 기준 무시
    blown = [(0, 100, 0.5), (1, 20, 0.0)]
    assert [s[0] for s in select_best(blown, 1, 0)] == [1]
    assert [s[0] for s in select_best([(0, 100, 0.5), (1, 20, 0.6)], 1, 0)] == [0]
    assert select_best([], 3, 0) == [] and select_best(scored, 0, 0) == []


def test_plan_stages_photos():
    st = plan_stages({"start": 2.7, "end": 5.0, "output": "photos", "upscale": "2x",
                      "stabilize": "person", "enhance": True}, 22.0)
    assert list(st) == ["trim", "photos", "upscale"]  # 안정화·화질 단계는 사진 모드에서 무시
    assert list(plan_stages({"start": 0, "end": 0, "output": "photos", "upscale": "none"}, 22.0)) == ["photos"]


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
    st4 = {"job_id": "aa11bb22cc", "params": {
        "start": 2.7, "end": 5, "output": "photos", "photo_n": 5, "upscale": "2x",
        "region": {"x": 0, "y": 0.3, "w": 1, "h": 0.5}}}
    assert J.result_name(st4) == "showcase_2.7-5s_photos5_2x_region_aa11bb.zip"


def test_region_crop():
    # iw/ih 비율 표현식 — 실제 디코딩 프레임(회전·클린 애퍼처 적용 후) 기준으로 평가된다
    f = _region_crop({"x": 0.25, "y": 0.25, "w": 0.5, "h": 0.5})
    assert f == ("crop=min(max(floor(iw*0.5000/2)*2\\,floor(iw*0.05/2)*2)\\,floor(iw/2)*2)"
                 ":min(max(floor(ih*0.5000/2)*2\\,floor(ih*0.05/2)*2)\\,floor(ih/2)*2)"
                 ":min(floor(iw*0.2500/2)*2\\,iw-out_w):min(floor(ih*0.2500/2)*2\\,ih-out_h)")
    # 경계 밖으로 나가는 w/h 는 프레임 안으로 미리 잘라 넣는다(0.9+0.5 → w=0.1)
    assert "iw*0.1000/2" in _region_crop({"x": 0.9, "y": 0.9, "w": 0.5, "h": 0.5})
    # 좌표는 0~1 로 클램프
    assert "iw*0.0000/2" in _region_crop({"x": -1, "y": 0, "w": 1, "h": 1})


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
