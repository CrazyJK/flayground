const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  /* mode: development, production, none */
  mode: 'development',
  entry: {
    index: './src/index.js',
    'page.ground': './src/page.ground.js',
    'page.today': './src/page.today.js',
    'page.random': './src/page.random.js',
    'page.develop': './src/page.develop.js',
    'page.tags': './src/page.tags.js',
    'page.control': './src/page.control.js',
    'page.shot-history': './src/page.shot-history.js',
    'page.statistics': './src/page.statistics.js',
    'page.image-frame': './src/page.image-frame.js',
    'page.image-grid': './src/page.image-grid.js',
    'page.kamoru-diary': './src/page.kamoru-diary.js',
    'popup.flay': './src/popup.flay.js',
    'popup.flay-card': './src/popup.flay-card.js',
    'popup.studio': './src/popup.studio.js',
    'popup.actress': './src/popup.actress.js',
    'popup.tag': './src/popup.tag.js',
  },
  devtool: 'source-map',
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
          from: 'src/style/*.css',
          to: 'css/[name][ext]',
        },
        {
          from: 'src/favicon/*.png',
          to: 'favicon/[name][ext]',
        },
        {
          from: 'src/favicon/*.ico',
          to: 'favicon/[name][ext]',
        },
        {
          from: 'src/svg/*.svg',
          to: 'svg/[name][ext]',
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
      {
        test: /\.txt$/,
        use: 'raw-loader',
      },
    ],
  },
};
