import './ChartUtils.scss';

/**
 * 화면에 그래프를 생성하는 공통 함수
 * @param title
 * @param data
 * @param stats
 * @returns
 */
export const createHistogramChart = (title: string, data: { label: string; count: number; percentage: number }[], stats: { mean: number; median: number; stdDev: number; total: number }) => {
  const chartContainer = document.createElement('div');
  chartContainer.className = 'chart-container';

  // 제목과 통계 정보
  const header = document.createElement('div');
  header.className = 'chart-header';
  header.innerHTML = `
      <h3>${title}</h3>
      <p>
        총 ${stats.total}개 | 평균: ${stats.mean.toFixed(2)} | 중앙값: ${stats.median.toFixed(2)} | 표준편차: ${stats.stdDev.toFixed(2)}
      </p>
    `;
  chartContainer.appendChild(header);

  // 히스토그램 컨테이너
  const histogramHeight = 500; // 기본 높이 설정
  const histogramContainer = document.createElement('div');
  histogramContainer.className = 'histogram-container';
  histogramContainer.style.height = `${histogramHeight}px`;
  chartContainer.appendChild(histogramContainer);

  const maxCount = Math.max(...data.map((d) => d.count), 1); // 최소값 1로 설정하여 0 division 방지

  data.forEach((item) => {
    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';
    histogramContainer.appendChild(barContainer);

    // 막대 그래프 (값이 0이면 최소 높이 4px로 표시)
    const barHeight = item.count === 0 ? 4 : (item.count / maxCount) * (histogramHeight - 50) + 4;
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.classList.toggle('zero', item.count === 0); // 값이 0인 경우 'zero' 클래스 추가
    bar.style.height = `${barHeight}px`;
    barContainer.appendChild(bar);

    // 값 표시
    const valueLabel = document.createElement('div');
    valueLabel.className = 'value-label';
    valueLabel.textContent = `${item.count}개 (${item.percentage}%)`;
    bar.appendChild(valueLabel);

    // X축 라벨
    const xAxisLabel = document.createElement('div');
    xAxisLabel.className = 'x-axis-label';
    xAxisLabel.textContent = item.label;
    barContainer.appendChild(xAxisLabel);
  });

  return chartContainer;
};
