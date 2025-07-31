export type PackStrategy = 'topLeft' | 'bottomLeft';
export const PackStrategies: PackStrategy[] = ['topLeft', 'bottomLeft'];
export interface PackOptions {
  gap?: number; // 요소 간의 간격 (기본값: 4px)
  padding?: number; // 컨테이너의 패딩 (기본값: 0px)
  maxHeight?: number; // 컨테이너의 최대 높이 (기본값: 2000px)
  strategy?: PackStrategy; // 배치 전략 (기본값: 'topLeft')
}

const defaultPackOptions: PackOptions = {
  gap: 0,
  padding: 0,
  maxHeight: 2000,
  strategy: 'topLeft',
};

export default class PackUtils {
  private packOptions: PackOptions;
  private resizeObservers: ResizeObserver[] = [];

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
    this.resizeObservers.forEach((observer) => observer.disconnect());
  }

  pack(container: HTMLElement): void {
    const resizeObserver = new ResizeObserver(() => {
      this.packElements(container);
    });
    resizeObserver.observe(container);
    this.resizeObservers.push(resizeObserver);

    this.packElements(container);
  }

  /**
   * 요소들을 패킹합니다.
   */
  private packElements(container: HTMLElement): void {
    const { gap, padding, maxHeight, strategy } = this.packOptions;
    console.debug('PackUtils.packElements', container, { gap, padding, maxHeight, strategy });

    const elements = Array.from(container.children) as HTMLElement[];
    if (elements.length === 0) return;

    // 컨테이너 스타일 설정
    container.style.position = 'relative';

    // 요소들의 크기 정보를 미리 계산 (DOM 접근 최소화)
    const elementData = elements.map((element) => {
      // 임시로 보이게 만들어서 크기 측정
      const originalDisplay = element.style.display;

      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.visibility = 'hidden';
      element.style.left = '0';
      element.style.top = '0';

      const { width, height } = element.getBoundingClientRect();

      // 원래 스타일 복원하지 않고 absolute로 유지
      element.style.visibility = 'visible';

      return {
        element,
        width: width + gap,
        height: height + gap,
        originalDisplay,
      };
    });

    const containerWidth = container.offsetWidth - padding * 2;
    const occupiedAreas: { x: number; y: number; width: number; height: number }[] = [];

    elementData.forEach((data, index) => {
      const { element, width, height } = data;

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

        for (const candidate of candidates) {
          if (candidate.y + height > maxHeight) continue;
          if (candidate.y < padding) continue;
          if (candidate.x + width > containerWidth + padding) continue;

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
      element.style.left = `${bestX}px`;
      element.style.top = `${bestY}px`;

      // 점유 영역 기록
      occupiedAreas.push({
        x: bestX,
        y: bestY,
        width,
        height,
      });
    });

    // 컨테이너 높이 업데이트
    if (strategy === 'bottomLeft') {
      // bottomLeft 전략: 가장 위쪽 요소부터 가장 아래쪽 요소까지의 실제 사용 높이
      const minY = Math.min(...occupiedAreas.map((area) => area.y));
      const maxY = Math.max(...occupiedAreas.map((area) => area.y + area.height));
      const actualHeight = maxY - minY + padding * 2;
      container.style.height = `${actualHeight}px`;

      // 요소들을 위쪽으로 이동시켜 컨테이너 상단에 맞춤
      const adjustY = minY - padding;
      if (adjustY > 0) {
        occupiedAreas.forEach((area, index) => {
          const element = elementData[index].element;
          const newY = area.y - adjustY;
          element.style.top = `${newY}px`;
        });
      }
    } else {
      // topLeft 전략: 가장 아래쪽 요소를 기준으로 높이 설정
      const maxY = Math.max(...occupiedAreas.map((area) => area.y + area.height), 0);
      container.style.height = `${maxY + padding}px`;
    }
  }

  /**
   * 위치 후보들을 생성합니다.
   */
  private generatePositionCandidates(occupiedAreas: { x: number; y: number; width: number; height: number }[], containerWidth: number, elementWidth: number, elementHeight: number, padding: number, maxHeight: number, strategy: string): { x: number; y: number }[] {
    const candidates: { x: number; y: number }[] = [];

    // 기본 후보: 전략에 따라 다른 시작점
    if (strategy === 'bottomLeft') {
      candidates.push({ x: padding, y: maxHeight - elementHeight - padding });
    } else if (strategy === 'compact') {
      // compact: 바닥 중심점 기준으로 후보 생성 (반원형)
      const bottomCenterX = (containerWidth + padding * 2) / 2;
      const bottomY = maxHeight - padding;
      candidates.push({ x: Math.max(padding, bottomCenterX - elementWidth / 2), y: Math.max(padding, bottomY - elementHeight) });
    } else {
      candidates.push({ x: padding, y: padding });
    }

    // 기존 요소들의 모서리 기반 후보 생성
    occupiedAreas.forEach((area) => {
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
   */
  private hasOverlap(x: number, y: number, width: number, height: number, occupiedAreas: { x: number; y: number; width: number; height: number }[]): boolean {
    return occupiedAreas.some((area) => x < area.x + area.width && x + width > area.x && y < area.y + area.height && y + height > area.y);
  }

  /**
   * 위치의 점수를 계산합니다 (낮을수록 좋음).
   */
  private calculatePositionScore(x: number, y: number, strategy: string, maxHeight: number): number {
    switch (strategy) {
      case 'topLeft':
        return y * 1000 + x;
      case 'bottomLeft': {
        // bottomLeft: 아래쪽일수록 좋음, 왼쪽일수록 좋음
        // maxHeight에서 y를 뺀 값이 작을수록 아래쪽에 가까움
        const distanceFromBottom = maxHeight - (y + 100); // 100은 임시 높이로 bottom 기준 계산
        return distanceFromBottom * 1000 + x;
      }
      default:
        return y * 1000 + x;
    }
  }
}
