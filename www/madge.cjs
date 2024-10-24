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

  const { entry } = require('./webpack.common.cjs');

  console.log('\n⚙️ madge for dependencies');

  for (const [name, path] of Object.entries(entry)) {
    console.log('process...', name);

    const res = await madge(path, madgeConfig);
    const output = await res.svg();
    const svgString = output.toString();

    dependenciesSvgJson.push({ entry: name, svg: svgString });
  }

  fs.writeFile('./src/dependencies-viewer.json', JSON.stringify(dependenciesSvgJson), 'utf8', () => {
    console.log('write dependencies-viewer.json');
    console.log('');
  });
})();
