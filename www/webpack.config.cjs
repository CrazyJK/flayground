const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  /* mode: development, production, none */
  mode: 'development',
  entry: {
    main: './src/js/main.js',
    popup: './src/js/main.popup.js',
    vertical: './src/js/flay.vertical.js',
    search: './src/js/flay.search.js',
    archive: './src/js/flay.archive.js',
    basket: './src/js/flay.basket.js',
    mobile: './src/js/flay.mobile.js',
    score: './src/js/flay.score.js',
    subtitles: './src/js/flay.subtitles.js',
    summary: './src/js/flay.summary.js',
    lifeTimer: './src/js/kamoru.life.timer.js',
    note: './src/js/kamoru.note.js',
    todayis: './src/js/todayis.js',
    theme: './src/js/theme/flay.theme.js',
    banner: './src/js/image/image.banner.js',
    board: './src/js/image/image.board.js',
    cloud: './src/js/image/image.cloud.js',
    slide: './src/js/image/image.slide.js',
    tablet: './src/js/image/image.tablet.js',
    actress: './src/js/info/info.actress.js',
    flay: './src/js/info/info.flay.js',
    studio: './src/js/info/info.studio.js',
    flayall: './src/js/flay.all.js',
    favopus: './src/js/flay.fav.opus.js',
  },
  devtool: 'source-map',
  output: {
    // filename: '[name].[contenthash].js',
    filename: '[name].js',
    path: path.resolve(__dirname, '../src/main/resources/static/dist'),
    clean: true,
  },
  plugins: [new MiniCssExtractPlugin()],
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
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        commons: {
          test: /[\\/]lib[\\/]/,
          name: 'commons',
          chunks: 'all',
        },
      },
    },
  },
};
