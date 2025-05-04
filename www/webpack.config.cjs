const commonConfig = require('./webpack.common.cjs');
const { merge } = require('webpack-merge');
const argv = require('yargs')
  .options({
    env: {
      alias: 'e',
      describe: '빌드 환경(dev 또는 prod)',
      default: 'dev',
      type: 'string',
    },
    analyze: {
      describe: '번들 분석 보고서 생성 여부',
      default: false,
      type: 'boolean',
    },
    port: {
      describe: '개발 서버 포트',
      default: 9000,
      type: 'number',
    },
  })
  .help().argv;

module.exports = () => {
  console.log(`🚀 Building for ${argv.env} environment...`);

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
    console.log('📊 Bundle analyzer enabled with enhanced options');
  }

  return config;
};
