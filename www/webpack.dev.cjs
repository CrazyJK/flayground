const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

// 엔트리 포인트에 해당하는 HTML 파일이 있는지 확인
function getEntryHtmlPlugins() {
  const { entry } = require('./webpack.common.cjs');
  const plugins = [];

  // 각 엔트리 포인트에 대해 HTML 파일 생성
  Object.keys(entry).forEach((entryName) => {
    const templatePath = path.resolve(__dirname, `src/view/${entryName}.html`);
    if (fs.existsSync(templatePath)) {
      plugins.push(
        new HtmlWebpackPlugin({
          filename: `${entryName}.html`,
          template: `src/view/${entryName}.html`,
          chunks: ['runtime', 'vendors', entryName], // 런타임, 벤더 청크 및 엔트리 포인트 청크 포함
          inject: true, // JS와 CSS 자동 주입 활성화
        })
      );
    }
  });

  return plugins;
}

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map', // 개발 시 더 빠른 소스맵
  output: {
    filename: '[name].js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new ESLintPlugin({
      extensions: ['js'],
      emitWarning: true,
      failOnError: false,
      // ESLint 8 버전 호환성을 위한 설정
      useEslintrc: true, // .eslintrc.js 파일 사용
      fix: true, // 자동 수정 활성화
    }),
    {
      // watch 모드 알림 플러그인
      apply: (compiler) => {
        // 파일 변경 감지
        compiler.hooks.watchRun.tap('WatchRunPlugin', (comp) => {
          console.log(`\n✨ Changes detected, rebuilding... 🕒 ${new Date().toLocaleTimeString()}`);
          comp.modifiedFiles &&
            console.log(
              `\tmodifiedFiles : ${Array.from(comp.modifiedFiles)
                .map((file) => file.replace(/\\/g, '/').split('/').pop())
                .join(', ')}`
            );
          comp.removedFiles &&
            console.log(
              `\tremovedFiles  : ${Array.from(comp.removedFiles)
                .map((file) => file.replace(/\\/g, '/').split('/').pop())
                .join(', ')}`
            );
        });
      },
    },
    ...getEntryHtmlPlugins(),
  ],
  optimization: {
    runtimeChunk: 'single', // 런타임 코드를 단일 청크로 분리하여 캐싱 개선
    splitChunks: {
      chunks: 'all', // 모든 유형의 청크에 대해 분할 적용
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  performance: {
    hints: false, // 개발 환경에서는 성능 경고 비활성화
  },
  cache: {
    type: 'filesystem', // 파일시스템 캐시로 빌드 성능 향상
    allowCollectingMemory: true,
    buildDependencies: {
      config: [__filename], // 설정이 변경되면 캐시 무효화
    },
  },
  // watch 모드 최적화 설정
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300, // 여러 변경 사항을 모아서 한 번에 처리 (ms)
    poll: 1000, // 폴링 간격 (ms) - 특정 환경에서 필요한 경우 사용
  },
};
