const madge = require('madge');
const fs = require('fs');
const path = require('path');

const madgeConfig = {
  includeNpm: true,
  fontSize: '12px',
  fontName: 'D2Coding',
  webpackConfig: './webpack.common.cjs',
  rankdir: 'LR',
  // excludeRegExp: ['.scss', 'svg'],
  nodeColor: '#c6c5fe',
  noDependencyColor: '#cfffac',
  edgeColor: '#757575',
};

(async () => {
  const dependenciesSvgJson = [];
  const entries = fs
    .readdirSync('src', { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .filter((dirent) => path.extname(dirent.name) === '.js')
    .map((dirent) => path.parse(dirent.name).name);

  for (let entry of entries) {
    console.log('process...', entry);

    let res = await madge(`src/${entry}.js`, madgeConfig);
    let output = await res.svg();
    let svgString = output.toString();

    dependenciesSvgJson.push({ entry: entry, svg: svgString });
  }
  fs.writeFile('./src/dependencies-viewer.json', JSON.stringify(dependenciesSvgJson), 'utf8', () => {
    console.log('write dependencies-viewer.json');
  });
})();
