module.exports = () => {
  console.log(`🚀 Building for ${process.env.NODE_ENV} environment...`);

  const envText = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  const withAnalyze = process.env.ANALYZE || false;
  const isWatchMode = process.argv.includes('-w') || process.argv.includes('--watch');

  const commonConfig = require('./webpack.common.cjs');
  const envConfig = require(`./webpack.${envText}.cjs`);
  const config = require('webpack-merge').merge(commonConfig, envConfig);

  // 번들 분석기 활성화 여부
  if (withAnalyze) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
        // 더 상세한 설정 추가
        defaultSizes: 'gzip', // gzip 크기 표시
        generateStatsFile: true, // 통계 파일 생성
        statsFilename: 'stats.json', // 통계 파일 이름
      })
    );
    console.log('\n📊 Bundle analyzer enabled with enhanced options');
  }

  if (isWatchMode) {
    console.log('\n📝 Watch mode enabled - monitoring for changes...'); // watch 모드인지 감지
  }

  return config;
};
