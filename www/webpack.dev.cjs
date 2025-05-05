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
    }),
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
    buildDependencies: {
      config: [__filename], // 설정이 변경되면 캐시 무효화
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '../src/main/resources/static'),
    },
    host: 'localhost',
    hot: true, // 핫 모듈 교체 활성화
    historyApiFallback: true,
    compress: true,
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      progress: true,
      webSocketURL: {
        hostname: 'localhost',
      },
    },
    // 개발 서버 속도 최적화
    devMiddleware: {
      writeToDisk: false, // 메모리에서만 번들 유지
      stats: 'minimal', // 필요한 정보만 표시
    },
    // HTTPS 사용하려면 아래 주석 해제
    // https: true,
    proxy: [
      {
        context: ['/api'],
        target: 'https://flay.kamoru.jk',
        changeOrigin: true,
        secure: false, // 자체 서명 인증서 허용
        headers: {
          Host: 'flay.kamoru.jk',
          Origin: 'https://flay.kamoru.jk',
        },
        logLevel: 'debug',
      },
    ],
  },
};
