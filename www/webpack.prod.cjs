const WebpackManifestPlugin = require('webpack-manifest-plugin').WebpackManifestPlugin;
const { exec } = require('child_process');

// 의존성 다이어그램을 생성하는 플러그인
class MadgePlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('MadgePlugin', () => {
      console.log('\n🔍 Running madge to generate dependency diagrams...');
      exec('node madge.cjs', { cwd: __dirname }, (error, stdout) => {
        if (error) {
          console.error(`Error running madge: ${error}`);
          return;
        }
        console.log(stdout);
      });
    });
  }
}

// Chunkhash를 추가하는 플러그인
class AppendChunkhashPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('AppendChunkhashPlugin', () => {
      console.log('\n🔄 Running appendChunkhash to update HTML files...');
      exec('node appendChunkhash.cjs', { cwd: __dirname }, (error, stdout) => {
        if (error) {
          console.error(`Error running appendChunkhash: ${error}`);
          return;
        }
        console.log(stdout);
      });
    });
  }
}

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
    new MadgePlugin(), // madge.cjs 스크립트를 실행하는 플러그인
    new AppendChunkhashPlugin(), // appendChunkhash.cjs 스크립트를 실행하는 플러그인 추가
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
