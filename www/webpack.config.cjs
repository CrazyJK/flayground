const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  /* mode: development, production, none */
  mode: 'development',
  entry: {
    index: './src/index.js',
    'page.ground': './src/page.ground.js',
    'card.flay': './src/card.flay.js',
    'card.studio': './src/card.studio.js',
    'card.actress': './src/card.actress.js',
    'card.tag': './src/card.tag.js',
    'kamoru.diary': './src/kamoru.diary.js',
    'find.subtitles': './src/find.subtitles.js',
    'shot.history': './src/shot.history.js',
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
};
