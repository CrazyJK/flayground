# 영상 화질 개선(업스케일 · 슬로모션) — flayAI 통합 계획

> 짧은 영상을 입력받아 **AI 업스케일(4K) + 배속 변경(슬로모션) + AI 프레임 보간**을 적용해
> 화질과 부드러움을 개선한 영상을 돌려주는 서버 기능. 안정화([video-stabilization-plan.md](video-stabilization-plan.md))와
> 같은 방식의 새 서브시스템으로 통합한다.
>
> 파이프라인 자체는 2026-07-24 별도 세션에서 실제 영상(iPhone 세로 1080p 30fps, 3초·5초)으로
> 끝까지 검증했다(§2 실측). **P1~P3(코어 파이프라인·API·웹 UI)은 2026-07-24 구현 완료** — §8 구현 현황.
> P4(체이닝·60fps 등)는 별도 합의 후 진행.

---

## 0. 한눈에 — 무엇을, 어디에

| 항목 | 결정(제안) | 근거 |
|---|---|---|
| 통합 방식 | **flayAI 레포 안 새 서브시스템** (`packages/enhancer` + `apps/api/routers/enhance.py` + `apps/web/src/app/enhance/`) | stabilizer 와 동일 패턴 — 같은 GPU·FFmpeg·FastAPI 스택, 잡 인프라 재사용 |
| 업스케일 엔진 | **realesrgan-ncnn-vulkan** 외부 바이너리 서브프로세스 | 검증 완료. torch 무관(Vulkan)이라 VRAM 관리 단순, 의존성 추가 0 |
| 보간 엔진 | **rife-ncnn-vulkan** 외부 바이너리 서브프로세스 | 검증 완료(v4.6 모델). 위와 동일 |
| 잡 처리 | **인하우스 서브프로세스 잡** — `packages/stabilizer/job.py` 패턴 재사용(가능하면 공용화) | 새 인프라 0, status.json·정리(cleanup)·취소 그대로 |
| 동시성 | **동시 1잡 + 인덱서·안정화와 상호배제** | 단일 GPU(RTX 4070 Ti 12GB). Vulkan 도 GPU 를 쓰므로 CUDA 작업과 경합 |
| 옵션 | **[업스케일: 없음·2배·4K] × [배속: 1x·0.5x·0.25x] × [보간: 끔·부드럽게]** | §4 |
| 프론트 | 만든다 — 업로드 + 옵션 + 진행 + 전후 비교(stabilize 페이지 구조 재사용) | §6 P3 |
| 중간 산출물 | `data/enhance/<job>/` PNG 프레임(gitignore), 보존기간 후 정리 | §3 디스크 |

## 1. 파이프라인 개념

> **Real-ESRGAN 이란?** 낮은 해상도 이미지를 AI 로 확대하는 초해상도(Super-Resolution) 모델이다.
> 단순 확대(보간)는 픽셀을 늘려 뿌옇게 되지만, Real-ESRGAN 은 학습된 패턴으로 디테일(머리카락,
> 옷 질감 등)을 **생성**하며 확대한다. ncnn-vulkan 빌드는 파이썬 없이 GPU(Vulkan)로 도는 단일 실행 파일이다.

> **RIFE 란?** 두 프레임 사이의 **중간 프레임을 AI 로 생성**하는 프레임 보간(Frame Interpolation) 모델이다.
> 슬로모션을 만들 때 프레임을 단순 반복하면 계단식으로 끊겨 보이는데, RIFE 로 중간 움직임을
> 만들어 넣으면 모든 프레임이 고유해져 부드럽게 재생된다.

처리 흐름(각 단계는 프레임 파일 단위로 **증분·멱등** — 중단 후 재실행하면 이어서):

```
입력 영상 (업로드)
  │ ① probe    — ffprobe: 해상도·fps·프레임수·회전 메타데이터 확인
  │ ② extract  — ffmpeg: 프레임 → PNG (자동 회전 적용됨)
  │ ③ upscale  — realesrgan-ncnn-vulkan: x4 업스케일 (옵션에 따라 생략)
  │ ④ interpolate — rife-ncnn-vulkan: 목표 프레임수로 보간 (옵션에 따라 생략)
  │ ⑤ encode   — ffmpeg: 목표 해상도로 다운스케일 + fps/배속 적용 + H.264/NVENC
  ▼
결과 영상 (data/enhance/<job>/out.mp4)
```

**슬로모션 구현 방식이 핵심**: 0.5배속은 "프레임 반복"이 아니라 **"RIFE 로 프레임수 2배 생성 →
원본 fps 로 인코딩"** 으로 만든다. 30fps 5초(150프레임) → RIFE 300프레임 → 30fps 인코딩 = 10초,
모든 프레임 고유. 배속과 보간이 한 수식으로 묶인다:

```
출력 길이   = 입력 길이 / 배속
필요 프레임수 = 출력 길이 × 출력 fps = 입력 프레임수 × (출력 fps / 입력 fps) / 배속
RIFE 배수   = 필요 프레임수 / 입력 프레임수   (1이면 보간 생략)
```

4K 는 **x4 업스케일 후 다운스케일**(1080p→4320p→2160p)로 만든다. x2 모델보다 디테일이 좋았다.

## 2. 실측 (2026-07-24 검증 세션, RTX 4070 Ti)

| 항목 | 값 |
|---|---|
| 입력 | iPhone 세로 1080×1920(회전 메타) 30fps, 3초(90프레임)·5초(150프레임) |
| Real-ESRGAN x4plus, 1080p→4320p | **약 4.3~4.5초/프레임** (90프레임 ≈ 7분, 150프레임 ≈ 11분) |
| RIFE v4.6, 4K(2160×3840) 2배 보간 | **약 0.2~0.3초/프레임** (180프레임 생성 ≈ 39초) |
| 인코딩 libx264 crf18 preset slow | 수십 초 (NVENC 로 단축 여지) |
| 결과 크기 | 4K 0.5x 6초 ≈ 21MB, 10초 ≈ 24MB |
| 품질 | 업스케일 디테일 생성 + RIFE 보간 슬로모션 모두 자연스러움(사용자 확인) |

→ **지배 비용은 업스케일**(프레임당 초 단위). 잡 시간 추정 = `프레임수 × 4.5초`가 1차 근사.
30초 영상(900프레임)이면 약 70분 — 입력 길이 제한이 필요하다(§7).

## 3. 함정 (검증 세션에서 실제로 겪음)

- **회전 메타데이터**: iPhone 세로 영상은 내부적으로 가로 1920×1080 + `rotation=±90`.
  ffmpeg 프레임 추출은 자동 회전을 적용하므로 추출 PNG 는 세로다. 인코딩 시 해상도를
  가로 고정(3840:2160)으로 박으면 **화면이 눌린다**. → 프레임 실측 크기 기준으로
  `scale='if(gte(iw,ih),3840,2160)':-2` 처럼 방향을 따라가야 한다.
- **홀수 해상도**: 스케일 출력은 `-2`(짝수 보정) + `yuv420p` 필수(H.264 호환).
- **디스크**: x4 업스케일 PNG(4320×7680)는 장당 30~50MB. 150프레임이면 중간 산출물만 ~7GB.
  잡 완료 시 프레임 삭제 + `cleanup_old_jobs` 패턴 재사용. 시작 전 여유 공간 검사.
- **진행률**: ncnn 바이너리는 stderr 로 `%` 를 찍는다(프레임당 0→100 반복). 파싱해서
  전체 진행률로 환산하거나, **출력 폴더 PNG 개수 폴링**(더 단순·정확)으로 보고한다.
- **프레임수 검증**: 각 단계 후 입력/출력 프레임 개수를 비교해 불일치 시 즉시 실패 처리.

## 4. 옵션 설계 (잡 파라미터 + UI)

| 옵션 | 값 | 기본 | 비고 |
|---|---|---|---|
| 업스케일 | `none` \| `2x` \| `4k` | `4k` | 4k = x4 후 목표 해상도로 다운스케일 |
| 배속 | `1` \| `0.5` \| `0.25` | `0.5` | 0.25x 는 RIFE 4배 생성(품질 검증 필요, 후속) |
| 보간 | `off` \| `smooth` | `smooth` | smooth = §1 수식에 따른 RIFE 배수 자동 산출 |
| 출력 fps | `keep` \| `60` | `keep` | smooth 보간 + 입력 fps 미만일 때만 적용(입력≥60 이면 무시). 1x+60fps 는 길이 불변 → 소리 유지 |
| 모델 | `realesrgan-x4plus` \| `anime` | 실사 | 애니메이션 소스용 모델 선택지 |

프리셋 버튼(예: "4K 슬로모션", "화질만 개선", "부드럽게만")으로 조합을 단순 노출한다.

## 5. config.yaml (안)

```yaml
enhance:
  # 영상 화질 개선 (docs/video-enhance-plan.md). 잡 산출물은 data/enhance/ (.gitignore)
  work_dir:          "data/enhance"
  realesrgan_bin:    "C:/kamoru/Apps/realesrgan/realesrgan-ncnn-vulkan.exe"
  rife_bin:          "C:/kamoru/Apps/rife/rife-ncnn-vulkan.exe"
  rife_model:        "rife-v4.6"
  esrgan_model:      "realesrgan-x4plus"
  target_height:     2160            # 4k 옵션의 목표(긴 변). 세로 영상은 자동으로 2160×3840
  max_input_seconds: 30              # 업스케일 비용(§2) 때문에 짧게 시작, 운영하며 조정
  min_free_gb:       30              # 시작 전 디스크 여유 검사
  encoder:           "h264_nvenc"    # 폴백 libx264 (stabilizer 와 동일 패턴)
  retain_hours:      72
```

바이너리 경로는 **config 로만** 참조(코드 하드코딩 금지). 실행 파일·모델은 외부 폴더라 레포 무관.

## 6. 단계별 구현 계획

**P1 — 코어 파이프라인 (CLI 로 end-to-end)** ✅ 완료
- `packages/enhancer/` 골격: `config.py`(config.yaml 로드·바이너리 존재 검증), `pipeline.py`(§1 단계),
  `plan.py`(옵션→프레임수·RIFE 배수·출력 fps 산출 순수 함수)
- stabilizer `job.py` 재사용 검토 — 그대로 쓸 수 있으면 import, 결합이 어색하면 최소 복제 후 후속 공용화
- CLI: `python -m packages.enhancer.cli run <입력> [옵션]` (pyproject `flay-enhance` 스크립트)
- 단위 테스트: `tests/test_enhancer.py` — `plan.py` 수식(배속×보간 조합, 세로/가로 해상도), 바이너리는 mock

**P2 — API 잡 통합** ✅ 완료
- `apps/api/routers/enhance.py`: POST/GET `jobs`, `result`(Range 지원), `cancel`, DELETE — stabilize 라우터 준용
- localhost-only + 동시 1잡 + **인덱서·안정화 상호배제**(기존 배제 로직에 enhance 추가)
- 진행률: 단계 가중치(extract 5% / upscale 70% / interpolate 15% / encode 10%) + PNG 개수 폴링

**P3 — 웹 UI** ✅ 완료
- `apps/web/src/app/enhance/page.tsx`: stabilize 페이지 구조 재사용 — 업로드, 옵션(프리셋+상세),
  진행(단계 불빛 + 예상 남은 시간 = 남은 프레임 × 실측 초/프레임), 결과 전후 비교 + 다운로드
- 예상 소요 시간을 **업로드 직후** 보여준다(§2 근사식) — 긴 영상의 비용을 사용자가 미리 알게

**P4 — 후속(별도 합의 후)** ⏳ 미착수
- **안정화 → 화질 개선 체이닝**: stabilize 결과를 enhance 입력으로 잇는 원클릭
- 0.25x 배속(RIFE 4배) 품질 검증 (60fps 출력은 2026-07-24 구현 완료 — §8)
- 사람 없는 프레임 자동 제거 옵션(YOLO 보유 — 프레임 추출 산출물용, 영상 출력과는 별개 기능)
- 인코딩 NVENC 기본 전환(P1 은 libx264 로 검증 후)

## 7. 남은 결정 / 리스크

- **입력 길이 제한**: 기본 30초 제안(≈ 70분 잡). 더 긴 입력은 업스케일 해상도를 낮추거나(2x) 분할 필요.
- **GPU 경합**: Vulkan(ncnn)과 CUDA(torch)가 같은 GPU 를 쓴다 — 상호배제가 전제. 배제 실패 시
  OOM 이 아니라 **속도 저하**로 나타나므로 감지 어려움 → 잡 시작 시 기존 잡 상태 검사 철저히.
  단, 잡 밖의 GPU 사용(영상 시청 등)과의 경합은 막을 수 없다 — 4K RIFE 에서 VRAM 고갈 시
  ncnn 이 **검은 프레임을 쓰고 정상 종료**하는 함정이 실측됨 → UHD 모드 + vk 로그 검증으로 대응(§8).
- **바이너리 미설치 환경**: config 검증 단계에서 명확한 에러(설치 안내 링크 포함)로 조기 실패.
- **RIFE 모델 버전**: v4.6 검증됨. 상위 버전(4.x대)은 품질/속도 트레이드오프 확인 후 교체.

## 8. 구현 현황 (2026-07-24)

### 구현됨

- **`packages/enhancer/`** — `config.py`(enhance 블록+기본값 병합, `check_binaries` 조기 검증),
  `plan.py`(§1 수식 순수 함수: RIFE 목표 프레임수·출력 fps(유리수)·목표 해상도(짧은변 2160, h264
  4096 상한 캡)·**단계 진행 구간을 예상 소요 시간 비례로 배분**·총 예상 초), `job.py`(status.json
  잡 저장소 — stabilizer 패턴 최소 복제), `pipeline.py`, `cli.py`(`run <job_id>` | `local <파일> [옵션]`
  | `cleanup`, pyproject `flay-enhance`).
- **파이프라인 증분·멱등**: extract/interpolate 는 `.done` 마커, **upscale 은 누락·불완전 프레임만
  재처리**(PNG 꼬리 IEND 검사 O(1) — 중단된 쓰기 감지). 각 단계 후 프레임수 일치 검증(§3).
  실측 검증: 훼손 프레임만 재생성되고 완성 프레임은 mtime 불변.
- **§3 함정 반영**: 해상도는 probe 값이 아니라 **추출 PNG 실측 크기**(회전 적용 후)로 재계획.
  진행률은 출력 폴더 PNG 개수 폴링. ncnn/ffmpeg stderr 는 `logs/<단계>.log`(파이프 데드락 방지).
  시작 전 디스크 여유(min_free_gb)·입력 길이(max_input_seconds) 검사.
- **오디오 정책**: 배속 1x + 원본에 오디오 있으면 aac 로 합류, 배속 변경 시 제거(+status.note 안내).
- **인코딩**: `h264_nvenc`(p5·vbr·cq19) → 실패 시 `libx264 slow crf18` 자동 폴백. PNG 시퀀스
  `-framerate <유리수>` 입력, lanczos 스케일 + yuv420p.
- **API `apps/api/routers/enhance.py`**: POST/GET `jobs`, `result`(GET+HEAD, `?variant=original`),
  `cancel`, **`retry`(실패/취소 잡을 멈춘 단계부터 재개 — 증분이라 안전)**, DELETE.
  업로드 직후 동기 ffprobe 로 길이 제한을 **잡 시작 전에** 거부. localhost-only.
- **GPU 상호배제 공용화 `apps/api/routers/_gpu.py`**: `gpu_busy()` 가 안정화·화질개선·인덱싱
  셋을 모두 검사 — stabilize 라우터도 이걸 쓰도록 교체(양방향 배제). `kill_tree()` 는
  `taskkill /F /T` 로 워커의 ncnn/ffmpeg 자식까지 종료(고아 GPU 프로세스 방지) — stabilize
  취소/삭제에도 적용.
- **웹 UI `apps/web/src/app/enhance/page.tsx`** (+ 헤더 "화질" 메뉴): stabilize 페이지 골격 재사용
  (가로 3열 반응형·드래그&드롭·최근 작업·전체 삭제). 프리셋(4K 슬로모션/화질만 개선/부드럽게만) +
  상세 옵션(업스케일·배속·보간 체크·실사/애니). **파일 선택 직후 예상 처리 시간**(§2 근사식 클라이언트판,
  30초 초과 사전 경고). 진행: plan.stages 순서대로 단계 불빛 + 남은 시간(예상 총소요 × 남은 비율).
  결과: 원본·결과 나란히 + **동시 비교 재생 — 원본을 결과 배속(½× 등)으로 낮춰 장면을 맞춰,
  보간 없는 끊김 vs RIFE 부드러움이 그대로 대비**. 실패 잡 "이어서 재시도" 버튼.
- **60fps 출력 옵션**(P4 선반영): `fps=keep|60` — smooth 보간 + 입력 fps 미만일 때 §1 수식의
  출력 fps 항으로 RIFE 배수 산출(`(60/입력fps)/배속`), 출력은 `60/1` 정수 유리수. 입력≥60 무시,
  보간 off 무시(UI 는 60fps 선택 시 보간 자동 켬). 1x+60fps 는 길이 불변이라 소리 유지.
  프리셋 "4K + 60fps" 추가. E2E: 24fps 2초 → 60fps 120프레임·2.0초·aac 유지.
- **완료 마커는 프레임 폴더 밖에**(실측 버그 수정): ncnn 바이너리가 입력 폴더의 모든 파일을
  프레임으로 집어 `.done` 이 가짜 프레임으로 오인됨(업스케일 없는 조합에서 RIFE 산출 깨짐) →
  마커를 `frames_*.done` 형제 파일로 이동 + 업스케일/보간 산출 PNG 무결성(IEND) 최종 검증 추가.
- **4K RIFE VRAM 보호**(실측 버그 수정): 2160×3840 4배 보간이 12GB VRAM 을 넘겨
  `vkAllocateMemory failed -2` → 디바이스 손실 → **AI 생성 프레임만 전부 검은 화면**(t=0 원본
  복사만 생존)인데 ncnn 은 exit 0 으로 끝남. 대응 ① 프레임 긴 변 ≥ `rife_uhd_long_side`(3000)
  이면 `-u`(UHD 모드) + `-j 1:1:2`(추론 스레드 1)로 피크 대폭 축소, ② 업스케일/보간 로그의
  vk 오류 시그니처를 검사해 조용한 실패를 **실패로 승격**(업스케일 캐시 보존 → 재시도는 보간만).
- **검증**: 단위 테스트 `tests/test_enhancer.py` 14개(plan 수식·60fps·잡 모델·설정). 합성 클립 E2E
  (1x 패스스루=오디오 유지 / 4k·0.5x·smooth=3840×2160·96프레임·4초 / 60fps 보간) +
  실패 잡 같은 id 재실행(이어가기) + 브라우저 실업로드 왕복.

### 남은 할 일

- [ ] **P4 항목**(별도 합의 후): 안정화→화질개선 체이닝, 0.25x 품질 검증, 60fps 출력,
      사람 없는 프레임 제거, 배속 변경 시 오디오 처리 옵션(atempo/무음 선택)
- [ ] 잡 저장소 공용화 — stabilizer/enhancer `job.py` 중복(최소 복제)을 공용 모듈로 승격
- [ ] encode 단계 진행률 세분화(현재는 시작→끝 점프. ffmpeg `-progress` 파싱)
- [ ] 실사 x2 전용 모델 검토(현재 2x 는 x4 후 다운스케일 — 품질은 좋으나 비용 동일)
- [ ] 예상 소요(estimates.\*\_spf)를 실측 누적으로 자동 보정
