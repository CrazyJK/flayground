const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

// watch 모드 알림 및 성능 개선 플러그인
class WatchPlugin {
  apply(compiler) {
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

    // 빌드 완료 시 성능 측정
    compiler.hooks.done.tap('WatchDonePlugin', (stats) => {
      const time = stats.endTime - stats.startTime;
      console.log(`🚀 Build completed in ${time}ms`);

      // 큰 모듈 경고 (최적화 대상 식별 도움)
      const bigModules = [];
      stats.compilation.modules.forEach((module) => {
        if (module.resource && module.resource.includes('node_modules')) return; // node_modules 제외
        if (module.size() > 250000) {
          // 250KB 이상 모듈
          bigModules.push({
            name: module.resource || '(generated)',
            size: (module.size() / 1024).toFixed(2) + ' KB',
          });
        }
      });

      if (bigModules.length > 0) {
        console.log('⚠️ Large modules detected (potential optimization targets):');
        bigModules.forEach((mod) => {
          console.log(`\t${mod.name}: ${mod.size}`);
        });
      }
      console.log('');
    });
  }
}

// HTML 템플릿을 기반으로 엔트리 포인트에 대한 HTML 파일에 js 및 css를 자동으로 주입하는 플러그인
function getEntryHtmlPlugins() {
  const { entry } = require('./webpack.common.cjs');
  const plugins = [];
  Object.keys(entry).forEach((entryName) => {
    // popup.* 엔트리는 common-popup, 그 외는 common-page 청크만 포함
    const commonChunk = entryName.startsWith('popup.') ? 'common-popup' : 'common-page';
    plugins.push(
      new HtmlWebpackPlugin({
        filename: `${entryName}.html`,
        template: `src/view/${entryName}.html`,
        chunks: ['runtime', 'vendors', 'vendor.echarts', 'vendor.toast-ui', commonChunk, entryName],
        inject: true, // JS와 CSS 자동 주입 활성화
      })
    );
  });
  return plugins;
}

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map', // 소스 맵 설정 (개발 모드에서 디버깅 용이)
  output: {
    filename: '[name].js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      ignoreOrder: true, // CSS 순서 충돌 경고 무시 옵션 추가
    }),
    new ESLintPlugin({
      extensions: ['js'],
      emitWarning: true,
      failOnError: false,
      // ESLint 8 버전 호환성을 위한 설정
      useEslintrc: true, // .eslintrc.js 파일 사용
      fix: true, // 자동 수정 활성화
    }),
    new WatchPlugin(), // watch 모드 알림 및 성능 개선 플러그인
    ...getEntryHtmlPlugins(),
  ],
  optimization: {
    runtimeChunk: 'single', // 런타임 코드를 단일 청크로 분리하여 캐싱 개선
    moduleIds: 'named', // 모듈 ID를 읽기 쉬운 이름으로 설정하여 디버깅 용이성 향상
    chunkIds: 'named', // 청크 ID를 읽기 쉬운 이름으로 설정
    removeAvailableModules: false, // 개발 중 빌드 속도 향상을 위해 비활성화
    removeEmptyChunks: false, // 개발 중 빌드 속도 향상을 위해 비활성화
    splitChunks: {
      chunks: 'all', // 모든 유형의 청크에 대해 분할 적용
      minSize: 20000, // 최소 청크 크기 제한 (약 20KB)
      maxAsyncRequests: 30, // 비동기 요청 수 제한 증가
      maxInitialRequests: 25, // 초기 요청 수 제한 증가
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: -10,
          reuseExistingChunk: true,
        },
        // 주요 라이브러리 개별 청크로 분리
        defaultVendors: {
          test: /[\\/]node_modules[\\/](react|react-dom|lodash|moment|@toast-ui)[\\/]/,
          name(module) {
            // 라이브러리 이름에 따라 개별 청크 이름 생성
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
          priority: 10, // vendor보다 높은 우선순위
          reuseExistingChunk: true,
        },
        echarts: {
          test: /[\\/]node_modules[\\/](echarts|zrender)[\\/]/,
          name: 'vendor.echarts',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Page 기반 모듈을 별도 청크로 분리 (page.* 엔트리에만 포함)
        pageBase: {
          test: /[\\/]view[\\/]inc[\\/]Page/,
          name: 'common-page',
          chunks: 'all',
          priority: 10,
          enforce: true,
          reuseExistingChunk: true,
        },
        // Popup 기반 모듈을 별도 청크로 분리 (popup.* 엔트리에만 포함)
        popupBase: {
          test: /[\\/]view[\\/]inc[\\/]Popup/,
          name: 'common-popup',
          chunks: 'all',
          priority: 10,
          enforce: true,
          reuseExistingChunk: true,
        },
        // pageBase/popupBase를 제외한 나머지 공통 모듈
        common: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          name: 'common',
        },
      },
    },
  },
  performance: {
    hints: false, // 개발 환경에서는 성능 경고 비활성화
  },
  // watch 모드 최적화 설정
  watchOptions: {
    ignored: ['**/node_modules/**', '**/dist/**', '**/logs/**'],
    aggregateTimeout: 200, // 변경 감지 후 재빌드 전 대기 시간 단축 (ms)
    poll: false, // 폴링 대신 파일 시스템 이벤트 사용 (Windows에서 더 효율적)
    followSymlinks: false, // 성능 향상을 위해 심볼릭 링크 사용 안함
    stdin: true, // CTRL+C로 watch 모드 종료 가능
  },
};
