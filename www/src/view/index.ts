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
  // flay.video.play 값들을 추출하고 이산적 분포 그래프 생성
  const playValues = flayList.map((flay) => flay.video.play || 0);
  if (playValues.length > 0) {
    // 통계 계산
    const mean = playValues.reduce((sum, val) => sum + val, 0) / playValues.length;
    const variance = playValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / playValues.length;
    const stdDev = Math.sqrt(variance);

    // 중앙값 계산
    const sortedValues = [...playValues].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0 ? (sortedValues[sortedValues.length / 2 - 1]! + sortedValues[sortedValues.length / 2]!) / 2 : sortedValues[Math.floor(sortedValues.length / 2)]!;

    // 재생 횟수별 개수 집계 (이산적 히스토그램)
    const playCounts = new Map<number, number>();
    playValues.forEach((play) => {
      playCounts.set(play, (playCounts.get(play) ?? 0) + 1);
    });

    console.log(`재생 횟수 분포 (총 ${playValues.length}개)`);
    console.log(`평균: ${mean.toFixed(2)}, 중앙값: ${median.toFixed(2)}, 표준편차: ${stdDev.toFixed(2)}`);

    // 재생 횟수 데이터를 화면 표시용으로 변환
    const playChartData = Array.from(playCounts.entries())
      .sort(([a], [b]) => a - b) // 재생 횟수 순으로 정렬
      .map(([play, count]) => {
        const percentage = ((count / playValues.length) * 100).toFixed(1);
        return {
          label: `${play}회`,
          count,
          percentage: parseFloat(percentage),
        };
      }); // 필터링 제거하여 0인 값도 표시

    // 화면에 차트 추가
    const playChart = createHistogramChart('재생 횟수 분포', playChartData, { mean, median, stdDev, total: playValues.length });
    document.querySelector('body > header')!.appendChild(playChart);
  }

  // flay.video.rank 값들을 추출하고 정규분포 그래프 생성
  const rankValues = flayList.map((flay) => flay.video.rank || 0);
  if (rankValues.length > 0) {
    // 통계 계산
    const mean = rankValues.reduce((sum, val) => sum + val, 0) / rankValues.length;
    const variance = rankValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rankValues.length;
    const stdDev = Math.sqrt(variance);

    // 중앙값 계산
    const sortedValues = [...rankValues].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0 ? (sortedValues[sortedValues.length / 2 - 1]! + sortedValues[sortedValues.length / 2]!) / 2 : sortedValues[Math.floor(sortedValues.length / 2)]!;

    // 랭크별 개수 집계 (이산적 히스토그램)
    const rankCounts = new Map<number, number>();
    for (let i = -1; i <= 5; i++) {
      rankCounts.set(i, 0);
    }

    rankValues.forEach((rank) => {
      rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
    });

    // 화면에 그래프 표시
    console.log(`랭크 분포 (총 ${rankValues.length}개)`);
    console.log(`평균: ${mean.toFixed(2)}, 중앙값: ${median.toFixed(2)}, 표준편차: ${stdDev.toFixed(2)}`);

    // 랭크 데이터를 화면 표시용으로 변환
    const rankChartData = Array.from(rankCounts.entries()).map(([rank, count]) => {
      const percentage = ((count / rankValues.length) * 100).toFixed(1);
      return {
        label: `랭크 ${rank}`,
        count,
        percentage: parseFloat(percentage),
      };
    }); // 필터링 제거하여 0인 값도 표시

    // 화면에 차트 추가
    const rankChart = createHistogramChart('랭크 분포', rankChartData, { mean, median, stdDev, total: rankValues.length });
    document.querySelector('body > footer')!.appendChild(rankChart);
  }
});
