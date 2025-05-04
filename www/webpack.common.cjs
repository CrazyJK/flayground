const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  /* mode: development, production, none */
  mode: 'none',
  entry: {
    index: './src/view/index.js',
    style: './src/view/style.js',
    test: './src/view/test.js',
    'dependencies-viewer': './src/view/dependencies-viewer.js',
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
    'page.image-page': './src/view/page.image-page.js',
    'page.image-one': './src/view/page.image-one.js',
    'page.image-fall': './src/view/page.image-fall.js',
    'page.image-download': './src/view/page.image-download.js',
    'page.kamoru-diary': './src/view/page.kamoru-diary.js',
    'page.crawling': './src/view/page.crawling.js',
    'popup.cover': './src/view/popup.cover.js',
    'popup.flay': './src/view/popup.flay.js',
    'popup.flay-card': './src/view/popup.flay-card.js',
    'popup.studio': './src/view/popup.studio.js',
    'popup.actress': './src/view/popup.actress.js',
    'popup.tag': './src/view/popup.tag.js',
    'popup.monitor': './src/view/popup.monitor.js',
    'popup.image': './src/view/popup.image.js',
  },
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../src/main/resources/static/dist'),
    publicPath: '',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.json', '.scss', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@flay': path.resolve(__dirname, 'src/flay'),
      '@image': path.resolve(__dirname, 'src/image'),
    },
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: false,
    }),
    // MiniCssExtractPlugin은 환경별 설정 파일로 이동
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
  ],
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: false,
              // ignoreOrder: true, // CSS 순서 충돌 경고 무시 옵션 추가
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
              // `postcssOptions` is needed for postcss 8.x;
              // if you use postcss 7.x skip the key
              postcssOptions: {
                // postcss plugins, can be exported to postcss.config.js
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
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3,
                },
              ],
            ],
          },
        },
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: false,
          },
        },
        extractComments: false,
      }),
    ],
    moduleIds: 'deterministic', // 모듈 ID가 더 예측 가능하게 변경, 캐싱 개선
    chunkIds: 'deterministic',
  },
  performance: {
    assetFilter: function (assetFilename) {
      const lastIndex = assetFilename.lastIndexOf('.');
      const name = assetFilename.substring(0, lastIndex);
      const suffix = assetFilename.substring(lastIndex + 1);
      return !['json', 'map', 'ico'].includes(suffix) && !name.startsWith('vendors');
    },
    maxAssetSize: 500000,
    maxEntrypointSize: 500000,
    hints: false,
  },
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};
