const Webpack = require('webpack');
const { resolve, dirname, basename } = require('path');

module.exports = function(srcFile, reqFile, isDev, options) {
  return {
    devtool: isDev ? 'source-map' : false,
    entry: srcFile,
    output: {
      path: dirname(reqFile), // normally full path to output dir
      filename: basename(reqFile) // name of the out file without directory
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['babel-loader?sourceMap', 'eslint-loader?sourceMap'],
          exclude: /node_modules/
        }
      ]
    },
    plugins: isDev ? [] : [new Webpack.optimize.UglifyJsPlugin()],
    resolve: {
      // see this for more https://webpack.js.org/configuration/resolve/
      modules: [baseDir, resolve('./node_modules')]
    }
  };
};
