const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  /* mode: development, production, none */
  mode: 'none',
  entry: {
    index: './src/index.js',
    style: './src/style.js',
    'page.archive': './src/page.archive.js',
    'page.flay-page': './src/page.flay-page.js',
    'page.flay-one': './src/page.flay-one.js',
    'page.flay-grid': './src/page.flay-grid.js',
    'page.flay-play': './src/page.flay-play.js',
    'page.flay-play-history': './src/page.flay-play-history.js',
    'page.flay-basket': './src/page.flay-basket.js',
    'page.dragndrop': './src/page.dragndrop.js',
    'page.girls': './src/page.girls.js',
    'page.actress': './src/page.actress.js',
    'page.studio': './src/page.studio.js',
    'page.tags': './src/page.tags.js',
    'page.control': './src/page.control.js',
    'page.shot-history': './src/page.shot-history.js',
    'page.statistics': './src/page.statistics.js',
    'page.image-page': './src/page.image-page.js',
    'page.image-one': './src/page.image-one.js',
    'page.image-fall': './src/page.image-fall.js',
    'page.kamoru-diary': './src/page.kamoru-diary.js',
    'page.crawling': './src/page.crawling.js',
    'popup.cover': './src/popup.cover.js',
    'popup.flay': './src/popup.flay.js',
    'popup.flay-card': './src/popup.flay-card.js',
    'popup.studio': './src/popup.studio.js',
    'popup.actress': './src/popup.actress.js',
    'popup.tag': './src/popup.tag.js',
    'popup.monitor': './src/popup.monitor.js',
    'dependencies-viewer': './src/dependencies-viewer.js',
  },
  devtool: 'source-map',
  output: {
    // filename: '[name].[contenthash].js',
    // filename: '[name].[chunkhash].js',
    filename: '[name].js',
    path: path.resolve(__dirname, '../src/main/resources/static/dist'),
    publicPath: '',
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
          from: 'img/favicon/*',
          to: 'favicon/[name][ext]',
        },
        {
          from: 'img/svg/*',
          to: 'svg/[name][ext]',
        },
        {
          from: 'src/*.json',
          to: '[name][ext]',
        },
      ],
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      // excludeAssets: [/node_modules/],
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
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
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
      },
    ],
  },
  performance: {
    assetFilter: function (assetFilename) {
      const lastIndex = assetFilename.lastIndexOf('.');
      const name = assetFilename.substring(0, lastIndex);
      const suffix = assetFilename.substring(lastIndex + 1);
      return !['json', 'map', 'ico'].includes(suffix) && !['style', 'page.kamoru-diary'].includes(name);
    },
    maxAssetSize: 500000,
    maxEntrypointSize: 500000,
    hints: false,
  },
};
