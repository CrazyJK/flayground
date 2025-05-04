const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

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
        })
      );
    }
  });

  return plugins;
}

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map', // 개발 시 더 빠른 소스맵
  plugins: [
    new webpack.HotModuleReplacementPlugin(), // HMR 활성화
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG || 'false'),
    }),
    new ESLintPlugin({
      extensions: ['js'],
      emitWarning: true,
      failOnError: false,
    }),
    ...getEntryHtmlPlugins(),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, '../src/main/resources/static'),
    },
    hot: true, // 핫 모듈 교체 활성화
    port: 9000,
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
    https: {
      // 프로젝트 내 인증서 파일 사용
      key: fs.readFileSync(path.resolve(__dirname, '../src/main/resources/cert/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../src/main/resources/cert/server.crt')),
      ca: fs.readFileSync(path.resolve(__dirname, '../src/main/resources/cert/rootCA.crt')),
    },
    proxy: [
      {
        context: ['/info', '/flay', '/actress', '/studio', '/tag', '/code', '/image', '/file', '/search', '/actuator', '/sse', '/static'],
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
  performance: {
    hints: false, // 개발 환경에서는 성능 경고 비활성화
  },
  cache: {
    type: 'filesystem', // 파일시스템 캐시로 빌드 성능 향상
    buildDependencies: {
      config: [__filename], // 설정이 변경되면 캐시 무효화
    },
  },
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
};
