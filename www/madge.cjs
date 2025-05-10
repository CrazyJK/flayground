const madge = require('madge');
const fs = require('fs');

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
  console.log('\n🔍 Running madge to generate dependency diagrams...');

  const { entry } = require('./webpack.common.cjs');
  const dependenciesSvgJson = [];

  for (const [name, path] of Object.entries(entry)) {
    const res = await madge(path, madgeConfig);
    const output = await res.svg();
    const svgString = output.toString();

    dependenciesSvgJson.push({ entry: name, svg: svgString });
  }

  const filePath = './data/dependencies-viewer.json';
  fs.writeFileSync(filePath, JSON.stringify(dependenciesSvgJson), 'utf8');
  console.log('written', filePath);
})();
