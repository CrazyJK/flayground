import FlayFetch from '@lib/FlayFetch';
import { addResizeListener } from '@lib/windowAddEventListener';

/**
 * 밤하늘의 별(FlayMarker)을 표현하는 커스텀 엘리먼트
 * 화면 크기에 맞게 동적으로 별의 개수를 조절하며 배치
 */
export class FlayMarkerSky extends HTMLElement {
  #resizeState;
  #existingMarkers;
  #isLoading;

  constructor() {
    super();
    this.#existingMarkers = [];
    this.#isLoading = false;
    this.#resizeState = {
      originalWidth: window.innerWidth,
      originalHeight: window.innerHeight,
      markerPositions: new Map(), // 마커 위치 정보 저장
    };
  }

  connectedCallback() {
    this.style.position = 'relative';
    this.style.width = '100%';
    this.style.height = '100%';
    this.style.overflow = 'hidden';

    // 초기 화면 크기 저장
    this.#resizeState.originalWidth = window.innerWidth;
    this.#resizeState.originalHeight = window.innerHeight;

    // 리사이즈 이벤트 처리
    this.#setupResizeHandler();

    // 별(마커) 로드 및 표시
    this.#loadMarkers();
  }

  disconnectedCallback() {
    // 클린업: 애니메이션 취소, 이벤트 리스너 제거 등
    this.#existingMarkers = [];
    this.#resizeState.markerPositions.clear();
  }

  /**
   * 별을 로드하고 화면에 표시
   */
  async #loadMarkers() {
    if (this.#isLoading) return;
    this.#isLoading = true;

    try {
      const list = await FlayFetch.getFlayAll();

      // 화면 크기에 맞는 마커 수 계산
      const MAX_MARKERS = this.#calculateOptimalMarkerCount(list.length);

      // 목록 랜덤 섞기 및 필요한 개수만 추출
      const shuffledList = [...list].sort(() => Math.random() - 0.5).slice(0, MAX_MARKERS);

      console.log(`화면 크기 ${window.innerWidth}x${window.innerHeight}: 총 ${list.length}개 중 ${shuffledList.length}개의 별을 표시합니다.`);

      // 마커 모듈 임포트
      const { default: FlayMarker } = await import(/* webpackChunkName: "FlayMarker" */ '@flay/domain/FlayMarker');

      // 마커 순차적으로 생성 및 배치
      for (const flay of shuffledList) {
        // 별 모양 FlayMarker 생성
        const marker = new FlayMarker(flay, {
          showTitle: false,
          shape: 'star',
        });

        // ID 트래킹용 데이터 속성 추가
        if (flay.id) {
          marker.dataset.id = flay.id;
        }

        // 화면에 추가 및 위치 지정
        this.appendChild(this.#locateFlayMarker(marker));

        // 순차적 표시를 위한 지연
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.floor(Math.random() * 500) + 200 // 200-700ms
          )
        );
      }
    } catch (error) {
      console.error('FlayMarker 데이터를 불러오는 데 실패했습니다:', error);

      // 에러 메시지 표시
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = '별(FlayMarker) 데이터를 불러오는 중 문제가 발생했습니다';
      errorMsg.style.position = 'absolute';
      errorMsg.style.top = '50%';
      errorMsg.style.left = '50%';
      errorMsg.style.transform = 'translate(-50%, -50%)';
      errorMsg.style.backgroundColor = 'rgba(220, 53, 69, 0.9)';
      errorMsg.style.color = 'white';
      errorMsg.style.padding = '1rem 2rem';
      errorMsg.style.borderRadius = '8px';
      errorMsg.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      errorMsg.style.zIndex = '1000';
      this.appendChild(errorMsg);
    } finally {
      this.#isLoading = false;
    }
  }

  /**
   * 리사이즈 이벤트 핸들러 설정
   */
  #setupResizeHandler() {
    const debounce = (func, delay) => {
      let timeoutId;
      return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    };

    addResizeListener(
      debounce(() => {
        // 창 크기 변화 계산
        const widthRatio = window.innerWidth / this.#resizeState.originalWidth;
        const heightRatio = window.innerHeight / this.#resizeState.originalHeight;
        const areaRatio = widthRatio * heightRatio;

        console.log(`화면 크기 변경: ${Math.round(widthRatio * 100)}% x ${Math.round(heightRatio * 100)}%`);

        // 큰 화면 변화가 있을 때만 마커 수 조정 (20% 이상 변화)
        if (areaRatio > 1.2 || areaRatio < 0.8) {
          this.#adjustMarkerCount();

          // 리사이즈 상태 업데이트
          this.#resizeState.originalWidth = window.innerWidth;
          this.#resizeState.originalHeight = window.innerHeight;
        }

        // 마커 위치 조정
        requestAnimationFrame(() => {
          this.querySelectorAll('.flay-marker').forEach((marker) => this.#locateFlayMarker(marker, true));
        });
      }, 250)
    ); // 250ms 디바운스
  }

  /**
   * 화면 크기에 맞는 최적의 마커 개수 계산
   */
  #calculateOptimalMarkerCount(totalCount) {
    const screenArea = window.innerWidth * window.innerHeight;
    const baseArea = 1920 * 1080; // 기준 화면 크기
    const baseMarkers = 200; // 기준 마커 개수

    // 화면 면적 비율에 따라 마커 수 조정 (최소 50%, 최대 200%)
    const areaRatio = Math.max(0.5, Math.min(2, screenArea / baseArea));
    return Math.min(Math.floor(baseMarkers * areaRatio), totalCount, 400);
  }

  /**
   * 화면 크기 변화에 따라 마커 개수 조정
   */
  async #adjustMarkerCount() {
    try {
      const list = await FlayFetch.getFlayAll();
      const currentMarkers = this.querySelectorAll('.flay-marker');

      // 최적 마커 수 계산
      const optimalCount = this.#calculateOptimalMarkerCount(list.length);
      const currentCount = currentMarkers.length;

      console.log(`최적 마커 수: ${optimalCount}, 현재 마커 수: ${currentCount}`);

      // 마커 수 조정이 필요한 경우 (20% 이상 차이)
      if (Math.abs(optimalCount - currentCount) > currentCount * 0.2) {
        if (optimalCount > currentCount) {
          // 마커를 추가해야 하는 경우
          const addCount = optimalCount - currentCount;
          console.log(`마커 ${addCount}개 추가 중...`);

          // 이미 표시 중인 마커 ID 수집
          const visibleIds = new Set([...currentMarkers].map((m) => m.dataset.id));

          // 아직 표시되지 않은 항목들 중 랜덤 선택
          const availableItems = list
            .filter((item) => !visibleIds.has(item.id))
            .sort(() => Math.random() - 0.5)
            .slice(0, addCount);

          // 새 마커 추가
          const { default: FlayMarker } = await import('@flay/domain/FlayMarker');
          for (const item of availableItems) {
            const marker = new FlayMarker(item, {
              showTitle: false,
              shape: 'star',
            });
            if (item.id) {
              marker.dataset.id = item.id;
            }
            this.appendChild(this.#locateFlayMarker(marker));
            await new Promise((r) => setTimeout(r, 100));
          }
        } else {
          // 마커를 제거해야 하는 경우
          const removeCount = currentCount - optimalCount;
          console.log(`마커 ${removeCount}개 제거 중...`);

          // 현재 표시된 마커 중 랜덤하게 선택하여 제거
          const markersArray = [...currentMarkers];
          const toRemove = markersArray.sort(() => Math.random() - 0.5).slice(0, removeCount);

          // 애니메이션과 함께 제거
          toRemove.forEach((marker, index) => {
            setTimeout(() => {
              marker.animate(
                [
                  { transform: 'scale(1)', opacity: 1 },
                  { transform: 'scale(0)', opacity: 0 },
                ],
                {
                  duration: 500,
                  easing: 'ease-out',
                }
              ).onfinish = () => {
                this.#resizeState.markerPositions.delete(marker);
                marker.remove();
              };
            }, index * 50); // 약간의 시간차를 두고 제거
          });
        }
      }
    } catch (error) {
      console.error('마커 개수 조정 중 오류 발생:', error);
    }
  }

  /**
   * 위치가 겹치는지 확인
   */
  #isOverlapping(x, y, width, buffer = 10) {
    return this.#existingMarkers.some((marker) => {
      const dx = Math.abs(marker.x - x);
      const dy = Math.abs(marker.y - y);
      const minDistance = marker.width / 2 + width / 2 + buffer;
      return dx < minDistance && dy < minDistance;
    });
  }

  /**
   * 겹치지 않는 랜덤 위치 계산
   */
  #getRandomPosition() {
    const [min, max] = [20, 50];
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const randomWidth = Math.floor(Math.random() * (max - min)) + min;

      // 화면 안쪽에 위치하도록 경계 설정
      const buffer = randomWidth;
      const x = Math.floor(Math.random() * (window.innerWidth - buffer * 2)) + buffer;
      const y = Math.floor(Math.random() * (window.innerHeight - buffer * 2)) + buffer;

      if (this.#existingMarkers.length === 0 || !this.#isOverlapping(x, y, randomWidth)) {
        this.#existingMarkers.push({ x, y, width: randomWidth });
        return { x, y, randomWidth };
      }

      attempts++;
    }

    // 너무 많은 시도 후에도 안 겹치는 위치를 못 찾은 경우
    const randomWidth = Math.floor(Math.random() * (max - min)) + min;
    const x = Math.floor(Math.random() * (window.innerWidth - randomWidth)) + randomWidth / 2;
    const y = Math.floor(Math.random() * (window.innerHeight - randomWidth)) + randomWidth / 2;
    this.#existingMarkers.push({ x, y, width: randomWidth });
    return { x, y, randomWidth };
  }

  /**
   * FlayMarker 배치 함수
   */
  #locateFlayMarker(flayMarker, isResize = false) {
    // 리사이징 중인 경우
    if (isResize && this.#resizeState.markerPositions.has(flayMarker)) {
      const markerInfo = this.#resizeState.markerPositions.get(flayMarker);

      // 화면 크기 변화에 비례하여 위치 조정
      const widthRatio = window.innerWidth / this.#resizeState.originalWidth;
      const heightRatio = window.innerHeight / this.#resizeState.originalHeight;

      const newX = Math.round(markerInfo.x * widthRatio);
      const newY = Math.round(markerInfo.y * heightRatio);

      // 화면 바깥으로 나가지 않도록 조정
      const width = parseInt(flayMarker.style.width);
      const safeX = Math.min(Math.max(width / 2, newX), window.innerWidth - width / 2);
      const safeY = Math.min(Math.max(width / 2, newY), window.innerHeight - width / 2);

      flayMarker.style.left = `${safeX}px`;
      flayMarker.style.top = `${safeY}px`;

      // 크기 변화에 따른 애니메이션 (살짝 커졌다 줄어들기)
      const scale = Math.max(0.8, Math.min(1.2, (widthRatio + heightRatio) / 2));
      flayMarker.animate([{ transform: `scale(${1 / scale})` }, { transform: `scale(${scale})` }, { transform: 'scale(1)' }], {
        duration: 300,
        easing: 'ease-out',
      });

      return flayMarker;
    }

    // 새로 배치하는 경우
    const { x, y, randomWidth } = this.#getRandomPosition();
    flayMarker.style.position = 'absolute';
    flayMarker.style.left = `${x}px`;
    flayMarker.style.top = `${y}px`;
    flayMarker.style.width = `${randomWidth}px`;

    // 별 모양에 맞는 반짝이는 등장 애니메이션
    const keyframes = [
      { transform: 'scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.2) rotate(180deg)', opacity: 0.8, offset: 0.7 },
      { transform: 'scale(1) rotate(360deg)', opacity: 1 },
    ];

    flayMarker.animate(keyframes, {
      duration: 800,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // 튀어오르는 느낌의 이징
    });

    // 별이 반짝이는 효과 추가
    setTimeout(() => {
      const twinkle = [
        { opacity: 1, filter: 'brightness(1)' },
        { opacity: 1, filter: 'brightness(1.5)', offset: 0.5 },
        { opacity: 1, filter: 'brightness(1)' },
      ];
      flayMarker.animate(twinkle, {
        duration: 1500,
        iterations: Infinity,
        direction: 'alternate',
        easing: 'ease-in-out',
      });
    }, 800);

    // 위치 정보 저장 (리사이즈 대응용)
    this.#resizeState.markerPositions.set(flayMarker, { x, y, width: randomWidth });

    return flayMarker;
  }
}

// 커스텀 엘리먼트 등록
customElements.define('flay-marker-sky', FlayMarkerSky);
