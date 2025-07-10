const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// 엔트리 포인트 그룹화
const entryPoints = {
  core: {
    index: './src/view/index.ts',
    style: './src/view/style.ts',
    test: './src/view/test.js',
    'dependencies-viewer': './src/view/dependencies-viewer.js',
  },
  pages: {
    'page.archive': './src/view/page.archive.js',
    'page.flay-page': './src/view/page.flay-page.js',
    'page.flay-one': './src/view/page.flay-one.js',
    'page.flay-grid': './src/view/page.flay-grid.js',
    'page.flay-play': './src/view/page.flay-play.js',
    'page.flay-play-record': './src/view/page.flay-play-record.js',
    'page.flay-basket': './src/view/page.flay-basket.js',
    'page.cover-popout': './src/view/page.cover-popout.js',
    'page.dragndrop': './src/view/page.dragndrop.js',
    'page.girls': './src/view/page.girls.js',
    'page.actress': './src/view/page.actress.js',
    'page.studio': './src/view/page.studio.js',
    'page.tags': './src/view/page.tags.js',
    'page.control': './src/view/page.control.js',
    'page.history-shot': './src/view/page.history-shot.js',
    'page.history-play': './src/view/page.history-play.js',
    'page.statistics': './src/view/page.statistics.js',
    'page.flay-all': './src/view/page.flay-all.js',
  },
  images: {
    'page.image-page': './src/view/page.image-page.js',
    'page.image-one': './src/view/page.image-one.js',
    'page.image-fall': './src/view/page.image-fall.js',
    'page.image-circle': './src/view/page.image-circle.ts',
    'page.image-download': './src/view/page.image-download.js',
    'page.image-mask': './src/view/page.image-mask.ts',
  },
  misc: {
    'page.kamoru-diary': './src/view/page.kamoru-diary.js',
    'page.crawling': './src/view/page.crawling.js',
  },
  popups: {
    'popup.cover': './src/view/popup.cover.js',
    'popup.flay': './src/view/popup.flay.js',
    'popup.flay-card': './src/view/popup.flay-card.js',
    'popup.studio': './src/view/popup.studio.js',
    'popup.actress': './src/view/popup.actress.js',
    'popup.tag': './src/view/popup.tag.js',
    'popup.monitor': './src/view/popup.monitor.js',
    'popup.image': './src/view/popup.image.js',
  },
};

// 모든 엔트리 포인트를 하나의 객체로 병합
const entry = Object.values(entryPoints).reduce((acc, group) => {
  return { ...acc, ...group };
}, {});

module.exports = {
  entry,
  output: {
    path: path.resolve(__dirname, '../src/main/resources/static/dist'),
    publicPath: '',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json', '.scss', '.css'], // .ts 확장자 추가
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@flay': path.resolve(__dirname, 'src/flay'),
      '@image': path.resolve(__dirname, 'src/image'),
      '@svg': path.resolve(__dirname, 'src/svg'),
      '@nav': path.resolve(__dirname, 'src/nav'),
    },
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/view/img/favicon/*',
          to: 'favicon/[name][ext]',
        },
        {
          from: 'src/view/img/svg/*',
          to: 'svg/[name][ext]',
        },
        {
          from: 'data/*.json',
          to: '[name][ext]',
        },
      ],
    }),
    // 환경 변수 정의. src 폴더 내의 모든 JS 파일에서 사용 가능
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'process.env.WATCH_MODE': JSON.stringify(process.argv.includes('-w') || process.argv.includes('--watch')),
    }),
  ],
  module: {
    rules: [
      // TypeScript 파일 처리 규칙 (JavaScript와 병행 사용)
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                [
                  '@babel/preset-env',
                  {
                    useBuiltIns: 'usage',
                    corejs: 3,
                    modules: false,
                    targets: {
                      browsers: ['last 2 Chrome versions', 'last 2 Firefox versions', 'last 2 Safari versions', 'last 2 Edge versions'],
                    },
                  },
                ],
                '@babel/preset-typescript', // TypeScript 지원 추가
              ],
              plugins: process.env.NODE_ENV === 'production' ? [['transform-remove-console', { exclude: ['error', 'warn', 'info'] }]] : [],
            },
          },
        ],
      },
      // JavaScript 파일 처리 규칙 (기존 유지)
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true, // 캐시 활성화로 재빌드 성능 향상
          presets: [
            [
              '@babel/preset-env',
              {
                useBuiltIns: 'usage',
                corejs: 3,
                // 트리 쉐이킹 개선을 위한 모듈 설정
                modules: false,
                // 대상 브라우저 명시
                targets: {
                  browsers: ['last 2 Chrome versions', 'last 2 Firefox versions', 'last 2 Safari versions', 'last 2 Edge versions'],
                },
              },
            ],
          ],
          // 필요한 경우 console.log 제거
          plugins: process.env.NODE_ENV === 'production' ? [['transform-remove-console', { exclude: ['error', 'warn', 'info'] }]] : [],
        },
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: false,
            },
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: function () {
                  return [
                    require('autoprefixer'),
                    require('cssnano')({
                      preset: ['default', { discardComments: { removeAll: true } }],
                    }),
                  ];
                },
              },
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                // Dart Sass 2.0.0 호환성을 위한 설정
                outputStyle: 'compressed',
                includePaths: [path.resolve(__dirname, 'src')],
              },
              // 새로운 API 사용
              api: 'modern',
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext][query]',
        },
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10kb 이하는 인라인화
          },
        },
      },
      {
        test: /\.svg/,
        type: 'asset/source',
        generator: {
          emit: false,
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext][query]',
        },
      },
    ],
  },
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};
