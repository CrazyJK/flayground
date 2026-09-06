# 영상 스튜디오 — 안정화·화질·연출을 하나의 화면으로

> 상태: **P1~P4 구현 완료**(§3). flayAI 네비게이션에서 컬렉션 검색과 무관한 도구(안정화·화질·연출·ICO)를
> 별도 영역 `/studio` 로 분리하고, 그중 영상 편집·개선 계열 세 화면을 **하나의 파이프라인 화면**
> `/studio/video` 로 합쳤다. §1 은 통합 전 세 화면의 기능 매트릭스(통합 화면이 덮어야 했던 범위).

## 1. 통합 전 세 화면의 기능 매트릭스

| 기능 | 안정화 `/stabilize` | 화질 `/enhance` | 연출 `/showcase` |
| --- | --- | --- | --- |
| 입력 | mp4/mov/gif | mp4/mov/gif | 영상 |
| 구간 트림(0.1초) | ✗ | ✗ | ✓ |
| 처리 구역(사각형 ROI, 파일별 기억) | ✗ | ✗ | ✓ |
| 안정화 기준 | 배경 / 인물 / 둘 다(비교) | ✗ | 인물 고정 |
| 고정 강도 | 흔들림만 / 부분 / 완전 / **자동** | ✗ | 흔들림만 / 부분 / 완전 |
| 여백 처리 | blur / crop | ✗ | crop 고정(API 는 blur/black 도 받음) |
| 주인공 클릭 지정 | ✓ | ✗ | ✓ |
| 주인공 크기 고정(scale_lock) | ✓ | ✗ | API 만 |
| 저fps 보간(gif 끊김 완화, minterpolate) | ✓ | ✗ | ✗ |
| 업스케일 | ✗ | 원본 / 2배 / 4K | 원본 / 2배 / 4K |
| 배속 | ✗ | 1 / ½ / ¼ | 1 / ½ / ¼ |
| AI 프레임 보간(RIFE) | ✗ | off / smooth | on / off |
| 60fps 목표 | ✗ | ✓ | ✓ |
| 업스케일 모델 | ✗ | 실사 / 애니 | 실사 고정 |
| 결과 화면 | 원본↔결과 **동시 재생** 비교 | 원본↔결과 비교 | 결과만 |
| 잡 목록 · 취소 · 재개 | ✓ (재개 없음) | ✓ | ✓ |

백엔드는 `packages/stabilizer`, `packages/enhancer`, `packages/showcase` 세 패키지와 라우터 세 개.
**showcase 는 이미 stabilizer·enhancer 를 서브 잡으로 순차 실행하는 체인**이므로, 통합 화면의
백엔드 뼈대는 이미 있다 — 각 단계를 "끌 수 있게" 일반화하는 것이 핵심 변경이다.

## 2. 목표 구조

```
flayAI (컬렉션)                      flayAI 스튜디오 (도구, 별도 헤더)
├ 채팅 · 이미지 · 얼굴 · 라벨링        ├ /studio/video   영상 스튜디오 (안정화+화질+연출 통합)
├ 관리자 · 일기                       └ /studio/ico     ICO 변환
└ [스튜디오 →] 링크 하나                  (헤더에 [← flayAI] 링크)
```

- Next.js **라우트 그룹 `apps/web/src/app/studio/`** + 전용 `StudioHeader`. 앱·빌드·API 는 그대로
  (별도 앱으로 쪼개면 인증서·포트·빌드가 하나 더 늘어 운영 부담만 커진다).
- `AppHeader` 의 NAV 에서 안정화·화질·연출·ICO 를 빼고 "스튜디오" 링크 하나로 대체.

### 2.1 영상 스튜디오 화면 `/studio/video` — 파이프라인 단계형

```
① 입력        파일(mp4/mov/gif) · 구간(0.1초 탐색·여기부터/여기까지) · 처리 구역(사각형 핸들, 파일별 기억)
② 안정화      [끔 | 배경 | 인물]  강도(흔들림만/부분/완전/자동) · 여백(crop/blur) · 주인공 클릭 · 크기 고정 · 저fps 보간
③ 화질        [끔 | 켬]           업스케일(원본/2배/4K) · 배속(1/½/¼) · AI 보간 on/off · 60fps · 모델(실사/애니)
④ 결과        원본↔결과 동시 재생 비교 · 다운로드(설정 명시 파일명) · 최근 작업(설정 요약, 클릭 시 폼 복원)
```

- 단계 ②③은 각각 켜고 끌 수 있다. **②만 켬 = 기존 안정화 화면**, **③만 켬 = 기존 화질 화면**,
  둘 다 켬 = 연출. 구간을 전체로 두면 트림은 생략된다.
- 프리셋(목표 중심 버튼): "흔들림 제거만" · "4K 슬로모션" · "인물 연출 클립(구간+인물 고정+4K+½×)" 등
  — 세 화면의 기존 프리셋을 단계 조합으로 재정의.
- 새로고침 시 진행 중 잡·설정 복원, 제출 시 이전 잡 SSE 재구독 방지 등 showcase 의 UX 개선은 그대로 승계.

### 2.2 백엔드 — `packages/showcase` 파이프라인 일반화

| 항목 | 현재 | 변경 |
| --- | --- | --- |
| 안정화 단계 | 항상 person 모드 | `stabilize: off \| background \| person` — off 면 서브 잡 생략, background 는 vidstab 엔진 |
| 화질 단계 | 항상 실행 | `enhance: on \| off` — off 면 서브 잡 생략(안정화 결과를 그대로 최종 인코딩) |
| 트림 | 항상 | `start/end` 가 전체 구간이면 생략(원본 그대로 다음 단계로) |
| 강도 | dejitter/smooth/lock | + `auto`(stabilizer 가 이미 지원) |
| 크기 고정·저fps 보간 | API 만 / 없음 | 옵션으로 노출(stabilizer 옵션 그대로 전달) |
| 모델 | photo 고정 | `model: photo \| anime` |
| 구간 상한 | 10초 | 단계 조합별 상한 — 화질 켬 10초(업스케일 비용), 화질 끔 120초(stabilizer 상한) |
| 결과 | out.mp4 하나 | 유지. "둘 다(배경·인물 비교)"는 통합 화면에서 제외(§5) |

- 기존 `/api/stabilize`, `/api/enhance` 라우터와 패키지는 **그대로 둔다**(showcase 가 서브 잡으로
  사용). 프론트 단독 페이지만 제거하므로 백엔드 위험이 작다.
- `gpu_busy` 상호배제는 이미 showcase 를 최우선으로 검사한다.
- 패키지 이름은 `showcase` 유지(개명은 변경 범위만 키움). 문서에서 "영상 스튜디오의 백엔드"로 설명.

## 3. 단계별 실행 계획 — 전부 완료

검증 결과: P1 빌드·리다이렉트(옛 경로 308→`/studio/*`), P2 pytest 7건 + CLI E2E 3조합(안정화만 `[stabilize]` /
화질만 `[enhance]` / 둘 다 `[trim, stabilize, enhance]`) 모두 done, P3 브라우저 렌더·프리셋·단계 토글 확인,
P4 단독 페이지 제거 후 `/studio/{stabilize,enhance,showcase}` → `/studio/video` 리다이렉트.

```
P1 영역 분리 (프론트만)
   - app/studio/ 라우트 그룹 + StudioHeader, 기존 4페이지를 /studio/{stabilize,enhance,showcase,ico} 로 이동
   - AppHeader NAV 정리("스튜디오" 링크), 옛 경로는 next.config redirects 로 유지
   → 검증: yarn build·lint, 네비 왕복, 옛 URL 리다이렉트

P2 백엔드 일반화 (packages/showcase + routers/showcase.py)
   - stabilize off|background|person, enhance on|off, 트림 생략, auto/scale_lock/lowfps/model 파라미터
   - 단계 조합별 구간 상한, 결과 파일명 규칙에 단계 반영
   → 검증: pytest(계획·파일명 단위 테스트 추가), CLI local 로 조합 3종(안정화만/화질만/둘 다) E2E

P3 통합 화면 /studio/video
   - showcase 페이지를 기반으로 단계형 레이아웃, stabilize 의 원본↔결과 동시 재생 비교 이식, 프리셋 재정의
   → 검증: 브라우저에서 조합 3종 제출·진행·결과·복원 확인

P4 정리
   - /studio/stabilize·enhance·showcase 페이지 제거(→ /studio/video 리다이렉트), 문서·CLAUDE.md 갱신
   → 검증: 빌드, 문서-구현 대조
```

P1·P2 는 서로 독립이라 병행 가능. P3 는 P2 에 의존.

## 4. 리스크·트레이드오프

- **단독 페이지의 세부 기능 누락** — 안정화의 "둘 다 비교" 모드, 화질 페이지의 gif 원본 `<img>` 비교 등은
  통합 화면에서 빠지거나 단순화된다(§5 결정).
- **한 화면의 옵션 밀도** — 세 화면의 옵션이 한곳에 모이므로 단계별 접기(끈 단계는 한 줄로 축약)와
  프리셋으로 첫인상을 가볍게 유지해야 한다.
- **기존 잡 이력** — `data/stabilize`, `data/enhance` 의 단독 잡은 통합 목록에 나타나지 않는다(보존기간
  48/72시간 후 자연 소멸). 통합 표시는 잡 모델이 달라 비용 대비 가치가 낮다.
- **긴 입력 + 화질 끔** — 안정화만 120초까지 받으면 인물 모드 YOLO 추적이 수 분 걸린다(기존 안정화 화면과 동일).

## 5. 확정된 결정

1. **영역 이름·경로** — 스튜디오(`/studio`), 헤더 `StudioHeader`(영상 · ICO · ← flayAI).
2. **안정화·화질·연출 단독 페이지** — 제거. 옛 경로와 `/studio/{stabilize,enhance,showcase}` 는 `/studio/video` 로 영구 리다이렉트.
3. **"둘 다(배경·인물 비교)" 모드** — 통합 화면에서 제외(API 의 stabilizer `both` 는 남아 있음). 필요하면 잡을 두 번 돌려 최근 작업에서 비교.
4. **GIF 입력** — 유지(미리보기는 `<img>`, 구간 탐색 컨트롤은 숨김).
5. **ICO** — `/studio/ico` 로 이동만.
