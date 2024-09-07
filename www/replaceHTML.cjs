const fs = require('fs');

const { entry, output } = require('./webpack.common.cjs');
const outputPath = output.path;
const assets = require(outputPath + '\\assets.json');

Object.keys(entry).forEach((entryName) => {
  const htmlName = `${entryName}.html`;
  const cssName = `${entryName}.css`;
  const jsName = `${entryName}.js`;

  const chunkhash = assets[jsName].replace(entryName, '').replace('.js', '').substring(1);
  const newCssName = cssName + '?ch=' + chunkhash;
  const newJsName = assets[jsName];

  const htmlFilename = `${outputPath}\\${htmlName}`;
  const html = fs.readFileSync(htmlFilename, { encoding: 'utf8', flag: 'r' });
  const replacedHtml = html.replace(jsName, newJsName).replace(cssName, newCssName);

  fs.writeFileSync(htmlFilename, replacedHtml, 'utf8');

  console.log('[html]', htmlName, '    [css]', newCssName, '    [js]', newJsName);
});
