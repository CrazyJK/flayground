import { createHistogramChart } from '@lib/ChartUtils';
import FlayFetch from '@lib/FlayFetch';
import './inc/Page';
import './index.scss';

void import(/* webpackChunkName: "FacadeWebMovie" */ '@movie/FacadeWebMovie')
  .then(({ FacadeWebMovie }) => new FacadeWebMovie())
  .then(async (facadeWebMovie) => {
    document.querySelector('body > main')!.appendChild(facadeWebMovie);
    await facadeWebMovie.isEnded();
  })
  .then(() => {
    void import(/* webpackChunkName: "FlayMarkerFloat" */ '@flay/panel/FlayMarkerFloat')
      .then(({ FlayMarkerFloat }) => new FlayMarkerFloat())
      .then((flayMarkerFloat) => {
        document.body.appendChild(flayMarkerFloat);
      });
  });

void import(/* webpackChunkName: "ImageCircle" */ '@image/ImageCircle')
  .then(({ ImageCircle }) => new ImageCircle({ rem: 10, duration: 2000, eventAllow: true }))
  .then((imageCircle) => {
    document.head.appendChild(document.createElement('style')).textContent = `
        .image-circle { opacity: 0.5; transition: opacity 0.3s ease-in-out; }
        .image-circle:hover { opacity: 1; }`;
    imageCircle.classList.add('right-bottom');
    document.body.appendChild(imageCircle);
  });

void FlayFetch.getFlayAll().then((flayList) => {
  /**
   * 통계 계산 및 차트 생성 공통 함수
   */
  const createStatisticsChart = (title: string, values: number[], createCountsMap: (values: number[]) => Map<number, number>, formatLabel: (key: number) => string, container: Element) => {
    if (values.length === 0) return;

    // 통계 계산
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 중앙값 계산
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0 ? (sortedValues[sortedValues.length / 2 - 1]! + sortedValues[sortedValues.length / 2]!) / 2 : sortedValues[Math.floor(sortedValues.length / 2)]!;

    // 개수 집계
    const countsMap = createCountsMap(values);

    console.log(`${title} (총 ${values.length}개)`);
    console.log(`평균: ${mean.toFixed(2)}, 중앙값: ${median.toFixed(2)}, 표준편차: ${stdDev.toFixed(2)}`);

    // 차트 데이터 변환
    const chartData = Array.from(countsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([key, count]) => {
        const percentage = ((count / values.length) * 100).toFixed(1);
        return {
          label: formatLabel(key),
          count,
          percentage: parseFloat(percentage),
        };
      });

    // 화면에 차트 추가
    const chart = createHistogramChart(title, chartData, { mean, median, stdDev, total: values.length });
    container.appendChild(chart);
  };

  // 재생 횟수 분포 차트
  const playValues = flayList.map((flay) => flay.video.play || 0);
  createStatisticsChart(
    '재생 횟수 분포',
    playValues,
    (values) => {
      const countsMap = new Map<number, number>();
      values.forEach((play) => {
        countsMap.set(play, (countsMap.get(play) ?? 0) + 1);
      });
      return countsMap;
    },
    (play) => `${play}회`,
    document.querySelector('body > header')!
  );

  // 랭크 분포 차트
  const rankValues = flayList.map((flay) => flay.video.rank || 0);
  createStatisticsChart(
    '랭크 분포',
    rankValues,
    () => {
      const countsMap = new Map<number, number>();
      for (let i = -1; i <= 5; i++) {
        countsMap.set(i, 0);
      }
      rankValues.forEach((rank) => {
        countsMap.set(rank, (countsMap.get(rank) ?? 0) + 1);
      });
      return countsMap;
    },
    (rank) => `랭크 ${rank}`,
    document.querySelector('body > footer')!
  );
});
