export const PackStrategies: PackStrategy[] = ['bottomLeft', 'topLeft', 'circle'];
export type PackStrategy = 'bottomLeft' | 'topLeft' | 'circle';
export interface PackOptions {
  gap: number; // 요소 간의 간격 (기본값: 4px)
  padding: number; // 컨테이너의 패딩 (기본값: 0px)
  maxHeight: number | undefined; // 컨테이너의 최대 높이 (기본값: 자동 계산)
  strategy: PackStrategy; // 배치 전략 (기본값: 'topLeft')
  fixedContainer: boolean; // 고정 크기 컨테이너 여부 (기본값: false)
  animate: boolean; // 애니메이션 여부 (기본값: false)
}

const defaultPackOptions: PackOptions = {
  gap: 0,
  padding: 0,
  maxHeight: undefined, // 자동 계산
  strategy: 'bottomLeft', // 기본 전략은 'bottomLeft'
  fixedContainer: false,
  animate: false, // 애니메이션 기본값은 false
};

export default class PackUtils {
  private packOptions: PackOptions;
  private resizeHandlers: (() => void)[] = [];

  /**
   * PackUtils 생성자
   * @param packOptions - 패킹 옵션
   *
   */
  constructor(packOptions: Partial<PackOptions> = {}) {
    this.packOptions = { ...defaultPackOptions, ...packOptions };
  }

  release(): void {
    // 현재 PackUtils 인스턴스의 리소스를 해제합니다.
    this.resizeHandlers.forEach((handler) => window.removeEventListener('resize', handler));
  }

  /**
   * 패킹을 수행합니다.
   * - resize 이벤트 핸들러를 등록하여 창 크기 변경 시 자동으로 패킹을 다시 수행합니다.
   * @param container - 패킹할 요소들이 포함된 컨테이너
   */
  async pack(container: HTMLElement): Promise<void> {
    await this.packElements(container);
    this.registerResizeHandler(container);
  }

  private registerResizeHandler(container: HTMLElement): void {
    const handleResize = async () => {
      await this.packElements(container);
    };

    window.addEventListener('resize', handleResize);
    this.resizeHandlers.push(handleResize);
  }

  /**
   * 요소들을 패킹합니다.
   * @param container - 패킹할 요소들이 포함된 컨테이너
   */
  private async packElements(container: HTMLElement): Promise<void> {
    const elements = Array.from(container.children) as HTMLElement[];
    if (elements.length === 0) return;

    const { gap, padding, maxHeight: userMaxHeight, strategy, fixedContainer, animate } = this.packOptions;
    const maxHeight = userMaxHeight ?? (container.offsetHeight || 2000); // maxHeight 자동 계산: 사용자 지정값 또는 컨테이너의 현재 높이

    console.group('PackUtils.packElements', container.id || container.className, `${elements.length} elements with strategy: ${strategy}, maxHeight: ${maxHeight}px, padding: ${padding}px, gap: ${gap}px, animate: ${animate}`);

    console.time('요소들의 크기 계산');
    // 요소들의 크기 정보를 미리 계산 (DOM 접근 최소화)
    const elementData = elements.map((element, index) => {
      // 임시로 보이게 만들어서 크기 측정
      const originalDisplay = element.style.display;

      element.style.position = 'absolute';
      element.style.display = 'block';
      element.style.visibility = 'hidden';
      element.style.transition = 'none'; // 애니메이션 비활성화
      element.style.contain = 'layout style paint'; // 레이아웃과 스타일을 포함하도록 contain 설정
      element.style.transform = 'translate3d(0, 0, 0)'; // GPU 가속을 위한 transform 사용
      element.style.willChange = 'left, top, opacity, z-index'; // will-change 속성 추가
      element.style.opacity = '0';
      element.style.zIndex = '-1'; // z-index를 -1로 설정하여 다른 요소 위에 표시되지 않도록 함
      [element.style.left, element.style.top] = (() => {
        switch (strategy) {
          case 'circle': // circle 전략은 컨테이너의 중간에 배치
            return [`calc(50% - ${element.offsetWidth / 2}px)`, `${maxHeight / 2}px`];
          case 'topLeft': // topLeft 전략은 컨테이너의 하단에 배치
            return [`${(element.offsetWidth * index) % container.offsetWidth}px`, `${maxHeight - padding}px`];
          default: // bottomLeft 전략은 컨테이너의 상단에 배치
            return [`${(element.offsetWidth * index) % container.offsetWidth}px`, `${padding}px`];
        }
      })();

      const { width, height } = element.getBoundingClientRect();

      return {
        element,
        width: width + gap,
        height: height + gap,
        originalDisplay,
      };
    });
    console.timeEnd('요소들의 크기 계산');

    const containerWidth = container.offsetWidth - padding * 2;
    const occupiedAreas: { x: number; y: number; width: number; height: number }[] = [];

    // circle 전략일 때 크기별로 정렬
    let sortedElementData = elementData;
    if (strategy === 'circle') {
      sortedElementData = [...elementData].sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        return areaB - areaA; // 큰 것부터 작은 것 순으로 정렬
      });
    }

    console.time('요소 packed');
    for (let index = 0; index < sortedElementData.length; index++) {
      const elementDataItem = sortedElementData[index];
      if (!elementDataItem) continue; // undefined 체크

      const { element, width, height, originalDisplay } = elementDataItem;

      let bestX = padding;
      let bestY = padding;
      let bestScore = Infinity;

      if (index === 0) {
        // 첫 번째 요소의 초기 위치를 전략에 따라 결정
        switch (strategy) {
          case 'circle': // circle 전략: 가장 큰 요소(첫 번째)를 중앙에 배치
            bestX = (containerWidth + padding * 2 - width) / 2;
            bestY = (maxHeight - height) / 2;
            break;
          case 'topLeft':
            bestX = padding;
            bestY = padding;
            break;
          default: // bottomLeft 전략: 왼쪽 아래에 배치
            bestX = padding;
            bestY = maxHeight - height - padding;
            break;
        }
      } else {
        // 효율적인 위치 찾기 알고리즘
        switch (strategy) {
          case 'circle': // circle 전략: 원형 배치
            {
              const centerX = (containerWidth + padding * 2) / 2;
              const centerY = maxHeight / 2;
              const position = this.generateCirclePosition(occupiedAreas, centerX, centerY, width, height, index, sortedElementData.length, containerWidth, maxHeight, padding);
              bestX = position.x;
              bestY = position.y;
            }
            break;
          default:
            {
              // bottomLeft 또는 topLeft 전략: 기존 요소들의 모서리를 기준으로 위치 후보 생성
              const candidates = this.generatePositionCandidates(occupiedAreas, containerWidth, width, height, padding, maxHeight, strategy);
              element.dataset.candidates = candidates.length.toString();

              for (const candidate of candidates) {
                if (candidate.y + height > maxHeight) continue; // 높이 초과
                if (candidate.y < padding) continue; // 패딩 미만
                if (candidate.x + width > containerWidth + padding) continue; // 너비 초과

                if (!this.hasOverlap(candidate.x, candidate.y, width, height, occupiedAreas)) {
                  const score = this.calculatePositionScore(candidate.x, candidate.y, strategy, maxHeight);
                  if (score < bestScore) {
                    bestScore = score;
                    bestX = candidate.x;
                    bestY = candidate.y;
                  }
                }
              }
            }
            break;
        }
      }

      // 요소 위치 설정
      if (animate) {
        const duration = 300; // 애니메이션 지속 시간 (ms)
        const timingFunction = 'ease-out'; // 애니메이션 타이밍 함수
        element.style.transition = `left ${duration}ms ${timingFunction}, top ${duration}ms ${timingFunction}, opacity ${duration}ms ${timingFunction}, z-index ${duration}ms ${timingFunction}`; // 300ms 부드러운 애니메이션
      }
      element.style.display = originalDisplay;
      element.style.visibility = 'visible';
      element.style.left = `${bestX}px`;
      element.style.top = `${bestY}px`;
      element.style.opacity = '1'; // 요소 보이기
      element.style.zIndex = '0'; // z-index를 0으로 설정하여 정상적으로 표시되도록 함

      // 점유 영역 기록
      occupiedAreas.push({
        x: bestX,
        y: bestY,
        width,
        height,
      });

      if (animate) {
        await new Promise((resolve) => setTimeout(resolve, 10)); // 잠시 대기 (애니메이션을 위해)
      }
    }
    console.timeEnd('요소 packed');

    switch (strategy) {
      case 'circle': // circle 전략: 원형 배치에 맞는 높이 설정
        if (!fixedContainer) {
          const maxY = Math.max(...occupiedAreas.map((area) => area.y + area.height), 0);
          const actualHeight = Math.max(maxY + padding, maxHeight);
          container.style.height = `${actualHeight}px`;
        }
        break;
      case 'topLeft': // topLeft 전략: 가장 아래쪽 요소를 기준으로 높이 설정
        {
          const maxY = Math.max(...occupiedAreas.map((area) => area.y + area.height), 0);
          container.style.height = `${maxY + padding}px`;
        }
        break;
      default: // bottomLeft 전략: 기존 로직 - 컨테이너 크기를 내용에 맞게 조정
        if (!fixedContainer) {
          const minY = Math.min(...occupiedAreas.map((area) => area.y));
          const maxY = Math.max(...occupiedAreas.map((area) => area.y + area.height));
          const actualHeight = maxY - minY + padding * 2;
          container.style.height = `${actualHeight}px`;
        }
        break;
    }

    console.groupEnd();
  }

  /**
   * circle 전략에서 원형 배치 위치를 생성합니다.
   * 요소들을 크기 순서대로 중심에서부터 동심원 형태로 배치합니다.
   * @param occupiedAreas - 이미 점유된 영역들
   * @param centerX - 중심 X 좌표
   * @param centerY - 중심 Y 좌표
   * @param elementWidth - 요소의 너비
   * @param elementHeight - 요소의 높이
   * @param elementIndex - 현재 요소의 인덱스
   * @param totalElements - 전체 요소 수
   * @param containerWidth - 컨테이너 너비
   * @param maxHeight - 최대 높이
   * @param padding - 패딩
   * @returns 배치할 위치
   */
  private generateCirclePosition(occupiedAreas: { x: number; y: number; width: number; height: number }[], centerX: number, centerY: number, elementWidth: number, elementHeight: number, elementIndex: number, totalElements: number, containerWidth: number, maxHeight: number, padding: number): { x: number; y: number } {
    // 첫 번째 요소(가장 큰 요소)는 중앙에 배치
    if (elementIndex === 0) {
      return { x: centerX - elementWidth / 2, y: centerY - elementHeight / 2 };
    }

    // 중심 요소 정보
    const centerElement = occupiedAreas[0];
    if (!centerElement) {
      // 중심 요소가 없으면 안전한 기본값 반환
      return { x: centerX - elementWidth / 2, y: centerY - elementHeight / 2 };
    }

    const centerElementRadius = Math.max(centerElement.width, centerElement.height) / 2;

    // 현재 요소의 반지름 (외접원 기준)
    const currentElementRadius = Math.max(elementWidth, elementHeight) / 2;

    // 기본 반지름: 중심 요소와 현재 요소가 딱 붙는 거리
    const baseRadius = centerElementRadius + currentElementRadius;

    // 동심원 레이어 계산
    const adjustedIndex = elementIndex - 1; // 중심 요소 제외
    const elementsPerRing = 8; // 각 링당 기본 요소 수
    const ringIndex = Math.floor(adjustedIndex / elementsPerRing);
    const positionInRing = adjustedIndex % elementsPerRing;

    // 링별 반지름 계산 (점진적으로 증가) - 더 촘촘하게 조정
    let ringRadius = baseRadius;
    if (ringIndex > 0) {
      // 이전 링의 요소들과 겹치지 않도록 반지름 조정 (1.5 -> 1.2로 감소)
      const averageElementSize = Math.sqrt(elementWidth * elementHeight);
      ringRadius = baseRadius + ringIndex * averageElementSize * 1.1;
    }

    // 각 링에서 요소 간격 계산
    const currentRingElements = Math.min(elementsPerRing + ringIndex * 2, totalElements - 1); // 링이 클수록 더 많은 요소
    const angleStep = (2 * Math.PI) / currentRingElements;
    const baseAngle = positionInRing * angleStep;

    // 여러 위치 후보 생성
    const candidates: { x: number; y: number; score: number }[] = [];

    // 성능 최적화: 자주 사용되는 값들 미리 계산
    const halfElementWidth = elementWidth / 2;
    const halfElementHeight = elementHeight / 2;

    // 1. 기본 원형 위치들
    for (let attempt = 0; attempt < 12; attempt++) {
      const radiusVariation = ringRadius + attempt * currentElementRadius * 0.1;
      const angleVariation = baseAngle + attempt * angleStep * 0.1;

      const cosAngle = Math.cos(angleVariation);
      const sinAngle = Math.sin(angleVariation);

      const x = centerX + cosAngle * radiusVariation - halfElementWidth;
      const y = centerY + sinAngle * radiusVariation - halfElementHeight;

      if (this.isValidPosition(x, y, elementWidth, elementHeight, containerWidth, maxHeight, padding)) {
        const distanceFromCenter = Math.sqrt((x + halfElementWidth - centerX) ** 2 + (y + halfElementHeight - centerY) ** 2);
        candidates.push({ x, y, score: distanceFromCenter });
      }
    }

    // 2. 기존 요소들과의 최적 거리 위치
    if (occupiedAreas.length > 1) {
      const placedElements = occupiedAreas.slice(1);

      placedElements.forEach((element) => {
        const elementCenterX = element.x + element.width / 2;
        const elementCenterY = element.y + element.height / 2;

        // 기존 요소 주변의 빈 공간 탐색 - 간격을 더 촘촘하게
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const distance = Math.max(element.width, element.height) / 2 + currentElementRadius;

          const cosAngle = Math.cos(angle);
          const sinAngle = Math.sin(angle);

          const x = elementCenterX + cosAngle * distance - halfElementWidth;
          const y = elementCenterY + sinAngle * distance - halfElementHeight;

          if (this.isValidPosition(x, y, elementWidth, elementHeight, containerWidth, maxHeight, padding)) {
            const distanceFromCenter = Math.sqrt((x + halfElementWidth - centerX) ** 2 + (y + halfElementHeight - centerY) ** 2);
            candidates.push({ x, y, score: distanceFromCenter });
          }
        }
      });
    }

    // 중심에서 가까운 순서로 정렬
    candidates.sort((a, b) => a.score - b.score);

    // 겹치지 않는 최적 위치 찾기 (성능 최적화: 충분히 좋은 위치를 찾으면 조기 종료)
    let bestCandidate = null;
    const acceptableScore = ringRadius * 0.8; // 허용 가능한 점수 임계값

    for (const candidate of candidates) {
      if (!this.hasOverlap(candidate.x, candidate.y, elementWidth, elementHeight, occupiedAreas)) {
        if (candidate.score <= acceptableScore) {
          // 충분히 좋은 위치를 찾았으면 즉시 반환 (조기 종료)
          return { x: candidate.x, y: candidate.y };
        }
        if (!bestCandidate) {
          bestCandidate = candidate;
        }
      }
    }

    // 허용 가능한 점수를 못 찾았지만 유효한 위치가 있으면 반환
    if (bestCandidate) {
      return { x: bestCandidate.x, y: bestCandidate.y };
    }

    // 모든 후보가 실패하면 외곽에 안전하게 배치 - 더 촘촘하게 (수학 계산 최적화)
    const fallbackRadius = ringRadius + currentElementRadius * 1.5;
    const fallbackAngle = (elementIndex * Math.PI * 2) / totalElements;
    const fallbackCos = Math.cos(fallbackAngle);
    const fallbackSin = Math.sin(fallbackAngle);
    const fallbackX = centerX + fallbackCos * fallbackRadius - halfElementWidth;
    const fallbackY = centerY + fallbackSin * fallbackRadius - halfElementHeight;

    return {
      x: Math.max(padding, Math.min(fallbackX, containerWidth + padding - elementWidth)),
      y: Math.max(padding, Math.min(fallbackY, maxHeight - padding - elementHeight)),
    };
  }

  /**
   * 위치가 유효한지 확인합니다 (경계 검사).
   * @param x - X 좌표
   * @param y - Y 좌표
   * @param width - 요소 너비
   * @param height - 요소 높이
   * @param containerWidth - 컨테이너 너비
   * @param maxHeight - 최대 높이
   * @param padding - 패딩
   * @returns 유효한 위치인지 여부
   */
  private isValidPosition(x: number, y: number, width: number, height: number, containerWidth: number, maxHeight: number, padding: number): boolean {
    return x >= padding && y >= padding && x + width <= containerWidth + padding && y + height <= maxHeight - padding;
  }

  /**
   * 위치 후보들을 생성합니다.
   * @param occupiedAreas - 이미 점유된 영역들
   * @param containerWidth - 컨테이너의 너비
   * @param elementWidth - 요소의 너비
   * @param elementHeight - 요소의 높이
   * @param padding - 컨테이너의 패딩
   * @param maxHeight - 컨테이너의 최대 높이
   * @param strategy - 배치 전략
   * @returns 위치 후보들의 배열
   */
  private generatePositionCandidates(occupiedAreas: { x: number; y: number; width: number; height: number }[], containerWidth: number, elementWidth: number, elementHeight: number, padding: number, maxHeight: number, strategy: string): { x: number; y: number }[] {
    const candidates: { x: number; y: number }[] = [];

    // 기본 후보: 전략에 따라 다른 시작점
    switch (strategy) {
      case 'topLeft': // topLeft 전략: 왼쪽 위에 배치
        candidates.push({ x: padding, y: padding });
        break;
      default: // bottomLeft 전략: 왼쪽 아래에 배치
        candidates.push({ x: padding, y: maxHeight - elementHeight - padding });
        break;
    }
    // 기존 요소들의 모서리 기반 후보 생성
    occupiedAreas.slice(-400).forEach((area) => {
      switch (strategy) {
        case 'topLeft': // topLeft 전략: 기존 로직
          candidates.push({ x: area.x + area.width, y: area.y }); // 오른쪽
          candidates.push({ x: area.x, y: area.y + area.height }); // 아래쪽
          candidates.push({ x: area.x + area.width, y: area.y + area.height }); // 대각선 아래
          break;
        default:
          {
            // bottomLeft 전략: 아래쪽과 왼쪽을 우선시
            candidates.push({ x: area.x + area.width, y: area.y }); // 오른쪽 (같은 높이)
            candidates.push({ x: area.x, y: area.y - elementHeight }); // 위쪽 (현재 요소의 top을 기준)
            candidates.push({ x: area.x + area.width, y: area.y - elementHeight }); // 대각선 위

            // 작은 요소가 큰 요소 위에 올 때: 기존 요소의 bottom을 기준으로 위쪽에 배치
            const bottomBasedY = area.y + area.height - elementHeight;
            if (bottomBasedY >= padding && bottomBasedY !== area.y - elementHeight) {
              candidates.push({ x: area.x, y: bottomBasedY }); // 기존 요소의 bottom 기준 위쪽
              candidates.push({ x: area.x + area.width, y: bottomBasedY }); // 기존 요소의 bottom 기준 오른쪽 위
            }
          }
          break;
      }
    });

    // 중복 제거 및 유효성 검사
    const uniqueCandidates = candidates.filter((candidate, index, self) => {
      return index === self.findIndex((c) => Math.abs(c.x - candidate.x) < 1 && Math.abs(c.y - candidate.y) < 1) && candidate.x >= padding && candidate.y >= padding && candidate.x + elementWidth <= containerWidth + padding && candidate.y + elementHeight <= maxHeight;
    });

    // 전략에 따른 정렬
    switch (strategy) {
      case 'topLeft': // 기존 로직: Y 좌표, X 좌표 순으로 정렬
        return uniqueCandidates.sort((a, b) => a.y - b.y || a.x - b.x);
      default: // bottomLeft: Y 좌표 내림차순 (아래쪽부터), X 좌표 오름차순 (왼쪽부터)
        return uniqueCandidates.sort((a, b) => b.y - a.y || a.x - b.x);
    }
  }

  /**
   * 겹침 여부를 확인합니다.
   * @param x - 요소의 X 좌표
   * @param y - 요소의 Y 좌표
   * @param width - 요소의 너비
   * @param height - 요소의 높이
   * @param occupiedAreas - 이미 점유된 영역들
   * @return true if there is an overlap, false otherwise
   */
  private hasOverlap(x: number, y: number, width: number, height: number, occupiedAreas: { x: number; y: number; width: number; height: number }[]): boolean {
    return occupiedAreas.some((area) => x < area.x + area.width && x + width > area.x && y < area.y + area.height && y + height > area.y);
  }

  /**
   * 위치의 점수를 계산합니다 (낮을수록 좋음).
   * @param x - 요소의 X 좌표
   * @param y - 요소의 Y 좌표
   * @param strategy - 배치 전략
   * @param maxHeight - 컨테이너의 최대 높이
   */
  private calculatePositionScore(x: number, y: number, strategy: string, maxHeight: number): number {
    switch (strategy) {
      case 'circle': {
        // circle: 중심에서 가까울수록 좋음
        const centerX = maxHeight / 2; // 임시로 maxHeight 사용
        const centerY = maxHeight / 2;
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        return distanceFromCenter;
      }
      case 'topLeft': {
        return y * 1000 + x;
      }
      default: {
        // bottomLeft: 아래쪽일수록 좋음, 왼쪽일수록 좋음
        // maxHeight에서 y를 뺀 값이 작을수록 아래쪽에 가까움
        const distanceFromBottom = maxHeight - y;
        return distanceFromBottom * 1000 + x;
      }
    }
  }
}
