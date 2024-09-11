const WebpackManifestPlugin = require('webpack-manifest-plugin').WebpackManifestPlugin;

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].[chunkhash].js',
  },
  plugins: [
    new WebpackManifestPlugin({
      filter: (file) => file.name.endsWith('.js'),
    }),
  ],
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
    maxAssetSize: 690000,
    maxEntrypointSize: 690000,
  },
};
