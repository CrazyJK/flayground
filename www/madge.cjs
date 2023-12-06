const madge = require('madge');
const fs = require('fs');

const entries = ['index', 'page.flay-page', 'page.flay-one', 'page.flay-grid', 'page.develop', 'page.tags', 'page.control', 'page.shot-history', 'page.statistics', 'page.image-page', 'page.image-one', 'page.image-grid', 'page.kamoru-diary', 'popup.flay', 'popup.flay-card', 'popup.studio', 'popup.actress', 'popup.tag', 'test-extendsElement'];

const madgeConfig = {
  includeNpm: true,
  fontSize: '12px',
  fontName: 'D2Coding',
  webpackConfig: './webpack.common.cjs',
  rankdir: 'LR',
};

// entries.forEach((entry) => {
//   madge(`src/${entry}.js`, madgeConfig)
//     .then((res) => res.image(`madge/${entry}.svg`))
//     .then((writtenImagePath) => {
//       console.log('Image written to ' + writtenImagePath);
//     });
// });

let dependenciesSvgJson = [];

(async () => {
  //
  for (let entry of entries) {
    let res = await madge(`src/${entry}.js`, madgeConfig);
    let output = await res.svg();
    let svgString = output.toString();

    dependenciesSvgJson.push({ entry: entry, svg: svgString });
  }
  fs.writeFile('./src/dependencies-viewer.json', JSON.stringify(dependenciesSvgJson), 'utf8', () => {
    console.log('write dependencies-viewer.json');
  });
})();
