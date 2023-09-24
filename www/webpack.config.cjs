const commonConfig = require('./webpack.common.cjs');
const { merge } = require('webpack-merge');
const argv = require('yargs').argv;

module.exports = () => {
  const envConfig = require(`./webpack.${argv.env}.cjs`);
  return merge(commonConfig, envConfig);
};
