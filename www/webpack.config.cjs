const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  /* mode: development, production, none */
  mode: 'development',
  entry: {
    index: './src/index.js',
    login: './src/login.js',
    main: './src/main.js',
    'flay.ground': './src/flay.ground.js',
    'flay.raw': './src/flay.raw.js',
    'flay.lastPlayed': './src/flay.lastPlayed.js',
    'flay.blank': './src/flay.blank.js',
    'flay.vertical': './src/flay.vertical.js',
    'flay.search': './src/flay.search.js',
    'flay.tag': './src/flay.tag.js',
    'flay.actress': './src/flay.actress.js',
    'flay.actress2': './src/flay.actress2.js',
    'flay.archive': './src/flay.archive.js',
    'flay.tile': './src/flay.tile.js',
    'flay.basket': './src/flay.basket.js',
    'flay.mobile': './src/flay.mobile.js',
    'flay.score': './src/flay.score.js',
    'flay.subtitles': './src/flay.subtitles.js',
    'flay.summary': './src/flay.summary.js',
    'flay.note': './src/flay.note.js',
    'flay.all': './src/flay.all.js',
    'flay.fav.opus': './src/flay.fav.opus.js',
    'info.actress': './src/info.actress.js',
    'info.flay': './src/info.flay.js',
    'info.studio': './src/info.studio.js',
    'info.tag': './src/info.tag.js',
    'today.is': './src/today.is.js',
    'cover.cloud': './src/cover.cloud.js',
    'image.alone': './src/image.alone.js',
    'image.banner': './src/image.banner.js',
    'image.board': './src/image.board.js',
    'image.cloud': './src/image.cloud.js',
    'image.slide': './src/image.slide.js',
    'image.tablet': './src/image.tablet.js',
    'image.fall': './src/image.fall.js',
    'kamoru.diary': './src/kamoru.diary.js',
    'kamoru.life.timer': './src/kamoru.life.timer.js',
    'split.view': '/src/split.view.js',
  },
  devtool: 'source-map',
  devServer: {
    static: './dist',
    allowedHosts: ['flay.kamoru.jk'],
  },
  output: {
    // filename: '[name].[contenthash].js',
    filename: '[name].js',
    path: path.resolve(__dirname, '../src/main/resources/static/dist'),
    clean: true,
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/*.html',
          to({ context, absoluteFilename }) {
            return '[name][ext]';
          },
        },
        {
          from: 'src/css',
          to: 'css',
        },
        {
          from: 'src/img',
          to: 'img',
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
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
            options: {
              // `postcssOptions` is needed for postcss 8.x;
              // if you use postcss 7.x skip the key
              postcssOptions: {
                // postcss plugins, can be exported to postcss.config.js
                plugins: function () {
                  return [require('autoprefixer')];
                },
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  optimization: {
    moduleIds: 'deterministic',
    // runtimeChunk: 'single',
    runtimeChunk: {
      name: '_runtime',
    },
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: '_vendors',
          chunks: 'all',
        },
        commons: {
          test: /[\\/]lib[\\/]/,
          name: '_commons',
          chunks: 'all',
        },
      },
    },
  },
};
