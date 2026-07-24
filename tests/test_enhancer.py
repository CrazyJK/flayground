"""enhancer 계획 수식 + 잡 모델 + 설정 단위 테스트 (외부 바이너리 불필요)."""

from __future__ import annotations

from packages.enhancer import job as J
from packages.enhancer import plan as P
from packages.enhancer.config import enhance_config

# --- plan: 배속 × 보간 ------------------------------------------


def test_rife_target_slowmo():
    assert P.rife_target(150, 0.5, "smooth") == 300   # 0.5x → 2배 생성
    assert P.rife_target(150, 0.25, "smooth") == 600  # 0.25x → 4배 생성
    assert P.rife_target(150, 1.0, "smooth") == 150   # 1x → 보간 생략
    assert P.rife_target(150, 0.5, "off") == 150      # 보간 끔 → 프레임 생성 없음


def test_out_fps():
    assert P.out_fps(30.0, 0.5, "smooth") == 30.0     # smooth: fps 유지(프레임을 늘림)
    assert P.out_fps(30.0, 0.5, "off") == 15.0        # off: fps 를 낮춰 슬로모션
    assert P.out_fps_rat("30000/1001", 0.5, "off") == "30000/2002"
    assert P.out_fps_rat("30000/1001", 0.5, "smooth") == "30000/1001"
    assert P.out_fps_rat("30/1", 0.25, "off") == "30/4"


# --- plan: 해상도(가로/세로/캡) ----------------------------------


def test_encode_size_4k():
    assert P.encode_size(1920, 1080, "4k") == (3840, 2160)   # 가로 16:9
    assert P.encode_size(1080, 1920, "4k") == (2160, 3840)   # 세로 16:9 (회전 반영 프레임)
    assert P.encode_size(1440, 1080, "4k") == (2880, 2160)   # 4:3


def test_encode_size_cap():
    # 2.39:1 시네마 — 짧은변 2160 이면 긴변 5163 > 4096 → 비율 유지 축소
    w, h = P.encode_size(2048, 858, "4k")
    assert w <= 4096 and h <= 4096
    assert w == 4096
    assert abs(w / h - 2048 / 858) < 0.01


def test_encode_size_2x_none():
    assert P.encode_size(640, 360, "2x") == (1280, 720)
    assert P.encode_size(641, 361, "none") == (640, 360)  # 홀수 → 내림 짝수 보정
    assert P.encode_size(640, 360, "none") == (640, 360)


# --- plan: 단계 구간 ---------------------------------------------


def test_build_stages_ranges():
    st = P.build_stages(150, 300, upscale_on=True, rife_on=True)
    names = list(st["stages"].keys())
    assert names == ["extract", "upscale", "interpolate", "encode"]
    # 구간이 0→100 을 단조 분할
    prev = 0
    for lo, hi in st["stages"].values():
        assert lo == prev and hi >= lo
        prev = hi
    assert prev == 100
    # 업스케일이 지배 비용 → 가장 넓은 구간
    widths = {k: hi - lo for k, (lo, hi) in st["stages"].items()}
    assert widths["upscale"] == max(widths.values())
    assert st["total_seconds"] > 0


def test_build_stages_skips():
    st = P.build_stages(150, 150, upscale_on=False, rife_on=False)
    assert list(st["stages"].keys()) == ["extract", "encode"]


# --- plan: 통합 --------------------------------------------------


def test_build_plan_4k_slowmo():
    cfg = enhance_config()
    meta = {"frame_w": 1080, "frame_h": 1920, "fps": 30.0,
            "fps_rat": "30/1", "n_frames": 150}
    pl = P.build_plan(meta, {"upscale": "4k", "speed": 0.5, "interpolate": "smooth"}, cfg)
    assert pl["n_out"] == 300 and pl["rife_on"] and pl["upscale_on"]
    assert (pl["out_w"], pl["out_h"]) == (2160, 3840)
    assert pl["out_fps"] == 30.0 and pl["out_fps_rat"] == "30/1"
    assert pl["out_duration"] == 10.0  # 5초 → 0.5x → 10초
    assert pl["total_seconds"] > 150 * 4  # 업스케일 지배(≈ 150×4.5초)


def test_build_plan_fps60():
    cfg = enhance_config()
    meta = {"frame_w": 1920, "frame_h": 1080, "fps": 30.0,
            "fps_rat": "30/1", "n_frames": 90}
    # 30→60fps, 1배속: 프레임 2배 생성, fps 60, 길이 유지(3초) → 소리도 유지 가능
    pl = P.build_plan(meta, {"upscale": "none", "speed": 1,
                             "interpolate": "smooth", "fps": 60}, cfg)
    assert pl["n_out"] == 180 and pl["rife_on"]
    assert pl["out_fps"] == 60.0 and pl["out_fps_rat"] == "60/1"
    assert pl["out_duration"] == 3.0

    # 29.97fps 입력도 60/1 정수 유리수로 (180.2 → 180프레임)
    meta2 = {"frame_w": 1920, "frame_h": 1080, "fps": 29.97,
             "fps_rat": "30000/1001", "n_frames": 90}
    pl2 = P.build_plan(meta2, {"upscale": "none", "speed": 1,
                               "interpolate": "smooth", "fps": 60}, cfg)
    assert pl2["out_fps_rat"] == "60/1" and pl2["n_out"] == 180

    # 60fps + 0.5배속: (60/30)/0.5 = 4배 생성, 60fps 슬로모션 6초
    pl3 = P.build_plan(meta, {"upscale": "none", "speed": 0.5,
                              "interpolate": "smooth", "fps": 60}, cfg)
    assert pl3["n_out"] == 360 and pl3["out_fps"] == 60.0
    assert pl3["out_duration"] == 6.0


def test_build_plan_fps60_ignored():
    cfg = enhance_config()
    # 입력이 이미 60fps → 다운/재생성 없이 무시(그대로 60fps)
    meta = {"frame_w": 1920, "frame_h": 1080, "fps": 60.0,
            "fps_rat": "60/1", "n_frames": 180}
    pl = P.build_plan(meta, {"upscale": "none", "speed": 1,
                             "interpolate": "smooth", "fps": 60}, cfg)
    assert not pl["rife_on"] and pl["n_out"] == 180 and pl["out_fps"] == 60.0

    # 보간 off → 생성할 프레임이 없어 무시(기존 off 동작 유지)
    meta2 = {"frame_w": 1920, "frame_h": 1080, "fps": 30.0,
             "fps_rat": "30/1", "n_frames": 90}
    pl2 = P.build_plan(meta2, {"upscale": "none", "speed": 0.5,
                               "interpolate": "off", "fps": 60}, cfg)
    assert not pl2["rife_on"] and pl2["out_fps"] == 15.0


def test_build_plan_noop_combo():
    cfg = enhance_config()
    meta = {"frame_w": 1920, "frame_h": 1080, "fps": 30.0,
            "fps_rat": "30/1", "n_frames": 90}
    # 업스케일 없음 + 1x + smooth → 보간도 생략(배수 1) → extract/encode 만
    pl = P.build_plan(meta, {"upscale": "none", "speed": 1, "interpolate": "smooth"}, cfg)
    assert not pl["rife_on"] and not pl["upscale_on"]
    assert list(pl["stages"].keys()) == ["extract", "encode"]
    assert pl["out_duration"] == 3.0


# --- job/config --------------------------------------------------


def test_config_defaults():
    c = enhance_config()
    assert c["default_upscale"] in P.UPSCALE_MODES
    assert float(c["default_speed"]) in P.SPEEDS
    assert c["esrgan_models"]["photo"]
    assert c["estimates"]["upscale_spf"] > c["estimates"]["rife_spf"]  # 지배 비용 순서


def test_job_status_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setattr(J, "_work_root", lambda: tmp_path)  # data/enhance 오염 방지

    job_id = J.new_job({"upscale": "4k", "speed": 0.5})
    st = J.get_status(job_id)
    assert st is not None
    assert st["status"] == "queued"
    assert st["params"]["upscale"] == "4k"

    J.set_status(job_id, status="running", progress=42, stage="upscale")
    st2 = J.get_status(job_id)
    assert st2["progress"] == 42 and st2["stage"] == "upscale"
    assert any(j["job_id"] == job_id for j in J.list_jobs())
    assert J.get_status("nope") is None


def test_cleanup_old_jobs(tmp_path, monkeypatch):
    import time

    monkeypatch.setattr(J, "_work_root", lambda: tmp_path)

    def backdate(job_id, hours):
        st = J.get_status(job_id)
        st["updated_at"] = time.time() - hours * 3600
        J._write(job_id, st)

    old = J.new_job({})
    J.set_status(old, status="done")
    backdate(old, 200)
    running = J.new_job({})
    J.set_status(running, status="running")
    backdate(running, 200)  # 오래됐지만 진행 중 → 보존

    assert J.cleanup_old_jobs(retain_hours=72) == 1
    assert J.get_status(old) is None
    assert J.get_status(running) is not None
