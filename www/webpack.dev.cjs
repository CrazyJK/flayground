const webpack = require('webpack');

module.exports = {
  mode: 'development',
  // plugins: [new webpack.HotModuleReplacementPlugin()],
  // devtool: 'inline-source-map',
  devtool: 'source-map',
  performance: {
    hints: 'warning',
  },
};
