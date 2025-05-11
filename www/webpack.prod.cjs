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
        chunks: ['runtime', 'vendors', 'flay-commons', entryName], // 런타임, 벤더, 공통 청크 및 엔트리 포인트 청크 포함
        inject: true, // JS와 CSS 자동 주입 활성화
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
    filename: '[name].[contenthash:8].js', // 더 짧은 해시 값 사용
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  plugins: [
    new WebpackManifestPlugin({
      filter: (file) => file.name.endsWith('.js') || file.name.endsWith('.css'),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].css', // [id] 대신 [name] 사용
      ignoreOrder: true, // CSS 순서 충돌 경고 무시 옵션 추가
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
      chunks: 'all', // 모든 유형의 청크에 대해 분할 적용
      minSize: 50000, // 최소 크기 50KB
      minChunks: 2, // 최소 2번 이상 사용되는 모듈만 분할
      maxAsyncRequests: 10, // 최대 비동기 요청 수 감소
      maxInitialRequests: 6, // 최대 초기 요청 수 감소
      automaticNameDelimiter: '-',
      enforceSizeThreshold: 150000, // 강제 분할 임계값 설정
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true, // 기존 청크 재사용
          name: 'vendors',
          chunks: 'all',
        },
        // defaultVendors: {
        //   test: /[\\/]node_modules[\\/](?!@toast-ui)/,
        //   priority: -10,
        //   reuseExistingChunk: true, // 기존 청크 재사용
        //   name: 'vendors',
        //   chunks: 'all',
        // },
        // toastUI: {
        //   test: /[\\/]node_modules[\\/]@toast-ui/,
        //   priority: 10, // 더 높은 우선순위 부여
        //   name(module) {
        //     // @toast-ui/{모듈명} 형태로 청크 이름 생성
        //     const packageName = module.context.match(/[\\/]node_modules[\\/]@toast-ui[\\/](.*?)(?:[\\/]|$)/)[1];
        //     return `toast-ui.${packageName}`;
        //   },
        //   minChunks: 1,
        //   reuseExistingChunk: true,
        // },
        default: {
          minChunks: 3,
          priority: -30,
          reuseExistingChunk: true,
          name: 'flay-commons',
          chunks: 'all',
        },
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
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
