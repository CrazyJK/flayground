const commonConfig = require('./webpack.common.cjs');
const { merge } = require('webpack-merge');

module.exports = () => {
  console.log(`🚀 Building for ${process.env.NODE_ENV} environment...`);

  const argv = {
    env: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
    port: process.env.PORT || 9000,
    analyze: process.env.ANALYZE || false,
  };

  const envConfig = require(`./webpack.${argv.env}.cjs`);
  let config = merge(commonConfig, envConfig);

  // 포트 덮어쓰기
  if (argv.port && config.devServer) {
    config.devServer.port = argv.port;
  }

  // 번들 분석기 활성화 여부
  if (argv.analyze) {
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

  return config;
};
