module.exports = {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  performance: {
    hints: 'error',
    maxAssetSize: 250000,
    maxEntrypointSize: 250000,
  },
};
