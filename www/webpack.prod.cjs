const WebpackManifestPlugin = require('webpack-manifest-plugin').WebpackManifestPlugin;
const { exec } = require('child_process');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');

// 의존성 다이어그램을 생성하는 플러그인
class MadgePlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('MadgePlugin', () => {
      console.log('\n🔍 Running madge to generate dependency diagrams...');
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

// 엔트리 포인트에 해당하는 HTML 파일이 있는지 확인
function getEntryHtmlPlugins() {
  const { entry } = require('./webpack.common.cjs');
  const plugins = [];

  Object.keys(entry).forEach((entryName) => {
    const templatePath = path.resolve(__dirname, `src/view/${entryName}.html`);
    if (fs.existsSync(templatePath)) {
      plugins.push(
        new HtmlWebpackPlugin({
          filename: `${entryName}.html`,
          template: `src/view/${entryName}.html`,
          chunks: [entryName],
          inject: true, // JS와 CSS 자동 주입 활성화
          minify: {
            collapseWhitespace: true,
            removeComments: true,
          },
        })
      );
    }
  });

  return plugins;
}

module.exports = {
  mode: 'production',
  devtool: 'source-map', // 프로덕션에서는 소스맵 파일 생성
  output: {
    filename: '[name].[contenthash:8].js', // 더 짧은 해시 값 사용
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  plugins: [
    new WebpackManifestPlugin({
      filter: (file) => file.name.endsWith('.js') || file.name.endsWith('.css'),
    }),
    new MadgePlugin(), // madge.cjs 스크립트를 실행하는 플러그인
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[id].[contenthash:8].css',
    }),
    // 환경 변수 정의
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.VERSION': JSON.stringify(require('./package.json').version || '1.0.0'),
    }),
    // Gzip 압축 적용
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // 10KB 이상만 압축
      minRatio: 0.8,
    }),
    ...getEntryHtmlPlugins(),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true, // 캐시 활성화로 재빌드 성능 향상
        },
      },
    ],
  },
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
            drop_console: true, // 콘솔 로그 제거
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
    // 청크 분할 최적화
    splitChunks: {
      chunks: 'all',
      minSize: 20000, // 최소 크기 (바이트)
      maxSize: 250000, // 최대 크기 (바이트)
      minChunks: 1, // 최소 청크 수
      maxAsyncRequests: 30, // 최대 비동기 요청 수
      maxInitialRequests: 30, // 최대 초기 요청 수
      automaticNameDelimiter: '~',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name(module) {
            // node_modules 패키지명 추출 - 안전한 추출 방식으로 변경
            try {
              // module.context가 존재하는지 확인
              if (module.context) {
                const matchResult = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (matchResult) {
                  return `vendor.${matchResult[1].replace('@', '')}`;
                }
              }

              // _identifier의 마지막 파일의 확장자를 뺀 이름 구하기
              const lastFileName = module._identifier
                .split(/[\\/]/)
                .pop()
                .replace(/\.[^/.]+$/, '');
              if (lastFileName) {
                return `vendor.${lastFileName}`;
              }

              return 'vendors'; // 패턴 매치 실패시 기본 이름 사용
            } catch (e) {
              return 'vendors'; // 오류 발생시 기본 이름 사용
            }
          },
        },
        common: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          name: 'common',
        },
      },
    },
    // 런타임 코드 분리
    runtimeChunk: 'single',
  },
  performance: {
    hints: 'warning',
    maxAssetSize: 690000,
    maxEntrypointSize: 690000,
  },
};
