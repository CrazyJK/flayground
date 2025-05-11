const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const { exec } = require('child_process');

// 의존성 다이어그램을 생성하는 플러그인
class MadgePlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('MadgePlugin', () => {
      exec('node madge.cjs', { cwd: __dirname }, (error, stdout) => {
        if (error) {
          console.error(`Error running madge: ${error}`);
          return;
        }
        console.log(stdout);
      });
    });
  }
}

// HTML 템플릿을 기반으로 엔트리 포인트에 대한 HTML 파일에 js 및 css를 자동으로 주입하는 플러그인
function getEntryHtmlPlugins() {
  const { entry } = require('./webpack.common.cjs');
  const plugins = [];
  Object.keys(entry).forEach((entryName) => {
    plugins.push(
      new HtmlWebpackPlugin({
        filename: `${entryName}.html`,
        template: `src/view/${entryName}.html`,
        chunks: [entryName],
        inject: true,
        minify: {
          collapseWhitespace: true,
          removeComments: true,
        },
      })
    );
  });
  return plugins;
}

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  plugins: [
    new WebpackManifestPlugin({
      filter: (file) => file.name.endsWith('.js') || file.name.endsWith('.css'),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].css',
      ignoreOrder: true,
    }),
    // Gzip 압축 적용
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // 10KB 이상만 압축
      minRatio: 0.8,
    }),
    new MadgePlugin(), // madge.cjs 스크립트를 실행하는 플러그인
    new BundleAnalyzerPlugin({
      analyzerMode: 'static', // 정적 HTML 파일로 분석 결과 생성
      reportFilename: 'bundle-report.html', // 분석 결과 파일 이름
      openAnalyzer: false, // 분석 결과 자동 열기 비활성화
      defaultSizes: 'gzip', // gzip 크기 표시
    }),
    ...getEntryHtmlPlugins(),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      // JS 최소화
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true, // 병렬 처리로 빌드 속도 향상
        extractComments: false,
      }),
      // CSS 최소화
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
            },
          ],
        },
        parallel: true,
      }),
    ],
    runtimeChunk: 'single', // 런타임 코드를 단일 청크로 분리하여 캐싱 개선
    moduleIds: 'deterministic', // 빌드 간에 변경되지 않는 짧은 숫자 ID를 사용합니다. 장기 캐싱에 유용하며, 프로덕션 모드에서 기본으로 활성화됩니다.
    chunkIds: 'deterministic', // 컴파일 간에 변경되지 않는 짧은 숫자 ID입니다. 장기 캐싱에 유용하며, 프로덕션 모드에서 기본으로 활성화됩니다.
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 2,
      maxAsyncRequests: 10,
      maxInitialRequests: 6,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        // 외부 라이브러리 분리
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          reuseExistingChunk: true,
        }, // 주요 라이브러리 개별 청크로 분리
        defaultVendors: {
          test: /[\\/]node_modules[\\/](prosemirror-.*|@toast-ui|tui-color-picker)[\\/]/,
          name(module) {
            // 라이브러리 이름에 따라 개별 청크 이름 생성
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
          priority: 10, // vendor보다 높은 우선순위
          reuseExistingChunk: true,
        },
        // 내부 유틸리티 라이브러리 분리
        lib: {
          test: /[\\/]src[\\/]lib[\\/]/,
          name: 'ground-lib',
          priority: 20,
          reuseExistingChunk: true,
          minChunks: 2,
        },
        // Flay 컴포넌트 분리
        flayDomain: {
          test: /[\\/]src[\\/]flay[\\/]/,
          name: 'ground-flay',
          priority: 20,
          reuseExistingChunk: true,
          minChunks: 2,
        },
        // 공통 코드 분리
        commons: {
          name: 'ground-commons',
          minChunks: 3,
          priority: -10,
          reuseExistingChunk: true,
        },
        // 기본 분할 그룹
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  performance: {
    hints: 'warning',
    maxAssetSize: 690000,
    maxEntrypointSize: 690000,
    assetFilter: function (assetFilename) {
      // dependencies-viewer.json 파일에 대한 경고 무시
      return !assetFilename.endsWith('dependencies-viewer.json') && !/\.(map|LICENSE|woff|woff2|ttf|eot)$/.test(assetFilename);
    },
  },
};
