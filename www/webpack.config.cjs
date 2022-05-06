const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  /* mode: development, production, none */
  mode: 'development',
  entry: {
    index: './src/index.js',
    main: './src/main.js',
    popup: './src/main.popup.js',
    vertical: './src/flay.vertical.js',
    search: './src/flay.search.js',
    tag: './src/flay.tag.js',
    actress: './src/flay.actress.js',
    actress2: './src/flay.actress2.js',
    archive: './src/flay.archive.js',
    tile: './src/flay.tile.js',
    basket: './src/flay.basket.js',
    mobile: './src/flay.mobile.js',
    score: './src/flay.score.js',
    subtitles: './src/flay.subtitles.js',
    summary: './src/flay.summary.js',
    note: './src/kamoru.note.js',
    todayis: './src/todayis.js',
    coverCloud: './src/cover.cloud.js',
    imageBanner: './src/image.banner.js',
    imageBoard: './src/image.board.js',
    imageCloud: './src/image.cloud.js',
    imageSlide: './src/image.slide.js',
    imageTablet: './src/image.tablet.js',
    infoActress: './src/info.actress.js',
    infoFlay: './src/info.flay.js',
    infoStudio: './src/info.studio.js',
    flayall: './src/flay.all.js',
    favopus: './src/flay.fav.opus.js',
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
