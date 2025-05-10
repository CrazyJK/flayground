module.exports = () => {
  console.log(`\n🚀 Building for ${process.env.NODE_ENV} environment...\n`);

  const envText = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  const isWatchMode = process.argv.includes('-w') || process.argv.includes('--watch');

  const commonConfig = require('./webpack.common.cjs');
  const envConfig = require(`./webpack.${envText}.cjs`);
  const config = require('webpack-merge').merge(commonConfig, envConfig);

  if (isWatchMode) {
    console.log('\n📝 Watch mode enabled - monitoring for changes...\n'); // watch 모드인지 감지
  }

  return config;
};
