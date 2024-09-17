const fs = require('fs');
const path = require('path');

const { entry, output } = require('./webpack.common.cjs');
const manifest = require(output.path + '/manifest.json');

Object.keys(entry).forEach((entryName) => {
  const htmlName = `${entryName}.html`;
  const cssName = `${entryName}.css`;
  const jsName = `${entryName}.js`;
  const htmlFilename = path.resolve(output.path, htmlName);

  const chunkhash = manifest[jsName].replace(entryName, '').replace('.js', '').substring(1);
  const newCssName = cssName + '?ch=' + chunkhash;
  const newJsName = manifest[jsName];

  const html = fs.readFileSync(htmlFilename, { encoding: 'utf8', flag: 'r' });
  const replacedHtml = html.replace(jsName, newJsName).replace(cssName, newCssName);
  fs.writeFileSync(htmlFilename, replacedHtml, 'utf8');

  console.log('[chunkhash]', chunkhash, '[html]', htmlName);
});
