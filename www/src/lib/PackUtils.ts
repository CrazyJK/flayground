export type PackStrategy = 'topLeft' | 'bottomLeft';
export const PackStrategies: PackStrategy[] = ['topLeft', 'bottomLeft'];
export interface PackOptions {
  gap?: number; // 요소 간의 간격 (기본값: 4px)
  padding?: number; // 컨테이너의 패딩 (기본값: 0px)
  maxHeight?: number; // 컨테이너의 최대 높이 (기본값: 자동 계산)
  strategy?: PackStrategy; // 배치 전략 (기본값: 'topLeft')
  fixedContainer?: boolean; // 고정 크기 컨테이너 여부 (기본값: false)
}

const defaultPackOptions: PackOptions = {
  gap: 0,
  padding: 0,
  maxHeight: undefined, // 자동 계산
  strategy: 'topLeft',
  fixedContainer: false,
};

export default class PackUtils {
  private packOptions: PackOptions;
  resizeHandlers: (() => void)[] = [];

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
    const { gap, padding, maxHeight: userMaxHeight, strategy, fixedContainer } = this.packOptions;

    // maxHeight 자동 계산: 사용자 지정값 또는 컨테이너의 현재 높이
    const maxHeight = userMaxHeight || container.offsetHeight || 2000;

    console.debug('PackUtils.packElements', container);

    const elements = Array.from(container.children) as HTMLElement[];
    if (elements.length === 0) return;

    // container.style.contain = 'layout style paint';

    // 요소들의 크기 정보를 미리 계산 (DOM 접근 최소화)
    const elementData = elements.map((element) => {
      // 임시로 보이게 만들어서 크기 측정
      const originalDisplay = element.style.display;

      element.style.position = 'absolute';
      element.style.display = 'block';
      element.style.visibility = 'hidden';
      element.style.transition = 'none'; // 애니메이션 비활성화
      element.style.contain = 'layout style paint'; // 레이아웃과 스타일을 포함하도록 contain 설정
      element.style.transform = 'translate3d(0, 0, 0)'; // GPU 가속을 위한 transform 사용
      element.style.willChange = 'left, top'; // will-change 속성 추가
      element.style.left = '50%';
      element.style.top = strategy === 'bottomLeft' ? '0' : container.offsetHeight + 'px'; // topLeft 전략은 컨테이너의 높이로 초기화

      const { width, height } = element.getBoundingClientRect();

      return {
        element,
        width: width + gap,
        height: height + gap,
        originalDisplay,
      };
    });

    const containerWidth = container.offsetWidth - padding * 2;
    const occupiedAreas: { x: number; y: number; width: number; height: number }[] = [];

    for (let index = 0; index < elementData.length; index++) {
      const { element, width, height, originalDisplay } = elementData[index];

      let bestX = padding;
      let bestY = padding;
      let bestScore = Infinity;

      if (index === 0) {
        // 첫 번째 요소의 초기 위치를 전략에 따라 결정
        if (strategy === 'bottomLeft') {
          bestX = padding;
          bestY = maxHeight - height - padding;
        } else {
          bestX = padding;
          bestY = padding;
        }
      } else {
        // 효율적인 위치 찾기 알고리즘
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

      // 요소 위치 설정
      element.style.display = originalDisplay;
      element.style.visibility = 'visible';
      element.style.transition = 'left 300ms ease, top 300ms ease'; // 300ms 부드러운 애니메이션
      element.style.left = `${bestX}px`;
      element.style.top = `${bestY}px`;

      // 점유 영역 기록
      occupiedAreas.push({
        x: bestX,
        y: bestY,
        width,
        height,
      });

      // 잠시 대기 (애니메이션을 위해)
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (strategy === 'bottomLeft') {
      if (!fixedContainer) {
        // fixedContainer = false: 기존 로직 - 컨테이너 크기를 내용에 맞게 조정
        const minY = Math.min(...occupiedAreas.map((area) => area.y));
        const maxY = Math.max(...occupiedAreas.map((area) => area.y + area.height));
        const actualHeight = maxY - minY + padding * 2;
        container.style.height = `${actualHeight}px`;
      }
    } else {
      // topLeft 전략: 가장 아래쪽 요소를 기준으로 높이 설정
      const maxY = Math.max(...occupiedAreas.map((area) => area.y + area.height), 0);
      container.style.height = `${maxY + padding}px`;
    }
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
    if (strategy === 'bottomLeft') {
      candidates.push({ x: padding, y: maxHeight - elementHeight - padding });
    } else {
      candidates.push({ x: padding, y: padding });
    }

    // 기존 요소들의 모서리 기반 후보 생성
    occupiedAreas.slice(-400).forEach((area) => {
      if (strategy === 'bottomLeft') {
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
      } else {
        // topLeft 전략: 기존 로직
        candidates.push({ x: area.x + area.width, y: area.y }); // 오른쪽
        candidates.push({ x: area.x, y: area.y + area.height }); // 아래쪽
        candidates.push({ x: area.x + area.width, y: area.y + area.height }); // 대각선 아래
      }
    });

    // 중복 제거 및 유효성 검사
    const uniqueCandidates = candidates.filter((candidate, index, self) => {
      return index === self.findIndex((c) => Math.abs(c.x - candidate.x) < 1 && Math.abs(c.y - candidate.y) < 1) && candidate.x >= padding && candidate.y >= padding && candidate.x + elementWidth <= containerWidth + padding && candidate.y + elementHeight <= maxHeight;
    });

    // 전략에 따른 정렬
    if (strategy === 'bottomLeft') {
      // bottomLeft: Y 좌표 내림차순 (아래쪽부터), X 좌표 오름차순 (왼쪽부터)
      return uniqueCandidates.sort((a, b) => b.y - a.y || a.x - b.x);
    } else {
      // 기존 로직: Y 좌표, X 좌표 순으로 정렬
      return uniqueCandidates.sort((a, b) => a.y - b.y || a.x - b.x);
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
      case 'topLeft':
        return y * 1000 + x;
      case 'bottomLeft': {
        // bottomLeft: 아래쪽일수록 좋음, 왼쪽일수록 좋음
        // maxHeight에서 y를 뺀 값이 작을수록 아래쪽에 가까움
        const distanceFromBottom = maxHeight - y;
        return distanceFromBottom * 1000 + x;
      }
    }
  }
}
