const commonConfig = require('./webpack/webpack.common.cjs');
const { merge } = require('webpack-merge');
const argv = require('yargs').argv;

module.exports = () => {
  const envConfig = require(`./webpack/webpack.${argv.env}.cjs`);
  return merge(commonConfig, envConfig);
};
