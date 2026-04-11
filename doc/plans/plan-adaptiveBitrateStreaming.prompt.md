# Plan: ABR (Adaptive Bitrate Streaming) 적용

## TL;DR

현재 원본 파일을 바이트 스트리밍하는 방식에서, FFmpeg 기반 HLS 트랜스코딩 + hls.js 클라이언트를 도입하여 모든 포맷(MP4/MKV/WMV/AVI)을 브라우저에서 부드럽게 재생할 수 있도록 개선. 요청 시 트랜스코딩 + 결과 캐시 전략.

## 현재 구조

- **서버**: Spring Boot 3.5.6 + Undertow, Java 21
  - `MovieStreamHandler`: 원본 파일을 Range 요청 지원하며 바이트 스트리밍 (버퍼 256KB)
  - `FlayStreamController`: `/stream/flay/movie/{opus}/{fileIndex}` 엔드포인트
  - `FileBasedFlaySource`: 파일시스템 기반, `Map<String, Flay>` 메모리 관리
  - `FlayAsyncExecutor`: @Async로 외부 프로세스 실행 가능 (ProcessBuilder 사용)
  - 비동기 실행기: Ground-Async (core=7, max=42)
- **클라이언트**: 네이티브 HTML5 `<video>`, hls.js 등 미디어 라이브러리 없음
  - `FlayFlix.ts`: 배경 비디오 재생 (autoplay, muted, loop), PlayTimeDB 재생위치 저장
  - `FlayVideoElement.ts`: 3개 소스 페일오버, 에러 시 다음 소스 전환
- **파일**: K:/Crazy/Storage, K:/Crazy/Archive 등에 저장
  - 포맷: MP4, MKV, WMV, AVI 등 혼재
  - 파일명: `[Studio][Opus][Title][Actress][Release].[ext]`

## Phase 1: 서버 - FFmpeg HLS 트랜스코딩 서비스

### Step 1: FFmpeg 설정 추가 (_독립_)

- `application-ground.properties`에 FFmpeg 경로, HLS 캐시 디렉토리 설정 추가
  - `flay.ffmpeg-path`: FFmpeg 실행 파일 경로
  - `flay.ffprobe-path`: FFprobe 실행 파일 경로
  - `flay.hls-cache-path`: HLS 세그먼트 캐시 디렉토리 (예: K:/Crazy/HLS-Cache)
- `application-ground-home.properties`에 실제 경로 설정

### Step 2: HLS 트랜스코딩 서비스 구현 (_depends on Step 1_)

- `server/src/main/java/jk/kamoru/ground/stream/HlsTranscoder.java` 신규 생성
- 핵심 기능:
  - `getOrTranscode(File sourceFile, String opus, int fileIndex)` → HLS 매니페스트 경로 반환
  - 캐시 확인: `{hls-cache-path}/{opus}/{fileIndex}/master.m3u8` 존재 여부
  - 캐시 miss 시 FFmpeg 프로세스 실행:
    ```
    ffmpeg -i {source} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k
      -f hls -hls_time 6 -hls_list_size 0 -hls_segment_filename {cache}/{opus}/{fileIndex}/seg_%04d.ts
      {cache}/{opus}/{fileIndex}/master.m3u8
    ```
  - H.264+AAC MP4는 `-c:v copy -c:a copy`로 리먹싱만 (트랜스코딩 불필요)
  - ffprobe로 원본 코덱 판별 → copy 가능 여부 결정
  - 트랜스코딩 진행 상태 관리 (진행 중이면 중복 실행 방지)
- `@Async` 비동기 트랜스코딩 + CompletableFuture 반환

### Step 3: 코덱 판별 유틸 구현 (_depends on Step 1_)

- `server/src/main/java/jk/kamoru/ground/stream/MediaProbe.java` 신규 생성
- ffprobe로 비디오/오디오 코덱, 컨테이너 정보 조회
  - `ffprobe -v quiet -print_format json -show_streams {file}`
- 결과 파싱하여 `MediaInfo` 레코드 반환 (videoCodec, audioCodec, container, bitrate 등)
- H.264+AAC 여부 판별 메서드

### Step 4: HLS 스트리밍 엔드포인트 추가 (_depends on Step 2_)

- `FlayStreamController`에 새 엔드포인트 추가:
  - `GET /stream/flay/hls/{opus}/{fileIndex}/master.m3u8` → HLS 매니페스트
  - `GET /stream/flay/hls/{opus}/{fileIndex}/{segment}` → `.ts` 세그먼트
- 매니페스트 요청 시:
  - 캐시 있으면 즉시 반환
  - 캐시 없으면 트랜스코딩 시작, 첫 세그먼트 생성 완료 시점에 매니페스트 반환 (FFmpeg -hls_flags append_list)
- Content-Type: `application/vnd.apple.mpegurl` (m3u8), `video/mp2t` (ts)
- CORS 헤더 필요 시 추가

### Step 5: 코덱 정보 API (_parallel with Step 4_)

- `GET /flay/media-info/{opus}/{fileIndex}` → 코덱/비트레이트 정보 반환
- 클라이언트가 HLS 필요 여부를 판단하는 데 사용 (선택적)

## Phase 2: 클라이언트 - hls.js 도입

### Step 6: hls.js 의존성 추가 (_독립_)

- `www/package.json`에 `hls.js` 추가 (yarn add hls.js)
- webpack 설정 변경 불필요 (일반 npm 모듈)

### Step 7: 비디오 재생 로직 변경 (_depends on Step 4, Step 6_)

- `FlayFlix.ts`의 `playOpus()` 수정:
  - HLS 엔드포인트 사용: `/stream/flay/hls/{opus}/0/master.m3u8`
  - Safari는 네이티브 HLS 지원 → `video.src` 직접 설정
  - Chrome/Firefox는 hls.js 사용:
    ```typescript
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    } else {
      // fallback: 기존 바이트 스트리밍
      video.src = directStreamUrl;
    }
    ```
  - PlayTimeDB 재생위치 저장 로직 유지
- `FlayVideoElement.ts`도 동일 패턴 적용

### Step 8: fallback 전략 (_parallel with Step 7_)

- HLS 실패 시 기존 바이트 스트리밍으로 fallback
- 트랜스코딩 준비 중 상태 UI 표시 (스피너 또는 진행률)

## Phase 3: 캐시 관리

### Step 9: HLS 캐시 관리 (_depends on Step 2_)

- 원본 파일 수정 시간과 캐시 비교 → 갱신 판단
- 디스크 용량 모니터링: 캐시 총 크기 제한 (설정 가능)
- LRU 방식으로 오래된 캐시 자동 정리 (선택적)
- `@Scheduled`로 주기적 캐시 정리 작업

## Relevant files

### 수정 대상

- `server/src/main/java/jk/kamoru/ground/stream/MovieStreamHandler.java` — 기존 바이트 스트리밍 (fallback으로 유지)
- `server/src/main/java/jk/kamoru/ground/flay/FlayStreamController.java` — HLS 엔드포인트 추가
- `server/src/main/resources/application-ground.properties` — FFmpeg/HLS 설정 추가
- `server/src/main/resources/application-ground-home.properties` — 실제 경로 설정
- `www/src/flay/panel/FlayFlix.ts` — playOpus()에 hls.js 통합
- `www/src/flay/panel/FlayVideoElement.ts` — 동일 패턴 적용
- `www/package.json` — hls.js 의존성 추가

### 신규 생성

- `server/src/main/java/jk/kamoru/ground/stream/HlsTranscoder.java` — FFmpeg HLS 트랜스코딩 서비스
- `server/src/main/java/jk/kamoru/ground/stream/MediaProbe.java` — ffprobe 코덱 판별 유틸
- `server/src/main/java/jk/kamoru/ground/stream/MediaInfo.java` — 미디어 정보 레코드
- `server/src/main/java/jk/kamoru/ground/stream/HlsCacheManager.java` — 캐시 관리 (Phase 3)

### 참조

- `FlayAsyncExecutor.java` — @Async + ProcessBuilder 패턴 참조
- `Ground.java` — AsyncExecutor 설정 참조
- `FileBasedFlaySource.java` — Flay 파일 접근 패턴 참조

## Verification

1. **단위 테스트**: MediaProbe 코덱 판별 로직 (H.264+AAC 판별, 비표준 코덱 감지)
2. **통합 테스트**: HLS 트랜스코딩 → 매니페스트/세그먼트 생성 확인
3. **수동 검증**:
   - MP4(H.264) → copy 모드로 빠르게 HLS 생성 확인
   - MKV/WMV → 트랜스코딩 후 HLS 재생 확인
   - 캐시 히트 시 즉시 재생 확인
   - FlayFlix에서 비디오 전환 시 이전 HLS 인스턴스 정리 확인
4. **Playwright 테스트**: FlayFlix 페이지에서 비디오 로드 → 재생 → 시크 동작 확인
5. **성능 확인**: H.264 MP4의 copy 모드가 실제로 빠른지 (1초 이내 매니페스트 생성)

## Decisions

- HLS 선택 (DASH 대신): hls.js의 브라우저 호환성이 더 넓고 구현이 단순
- 요청 시 트랜스코딩 (사전 변환 대신): 디스크 공간 절약, 점진적 적용 가능
- H.264+AAC copy 최적화: 이미 호환 코덱인 파일은 리먹싱만 수행 (초고속)
- 기존 바이트 스트리밍 유지: HLS fallback으로 보존

## Further Considerations

1. **FFmpeg 설치 전제**: 서버에 FFmpeg/ffprobe가 설치되어 있어야 함. Windows에서는 `choco install ffmpeg` 또는 수동 설치 → 경로 설정
2. **멀티 비트레이트 지원**: Phase 1에서는 단일 품질. 향후 여러 해상도(720p/480p) 동시 생성으로 확장 가능
3. **실시간 트랜스코딩 지연**: 처음 재생 시 FFmpeg 시작까지 2~5초 지연 → 로딩 UI 필요. 또는 첫 N개 세그먼트만 대기 후 재생 시작
