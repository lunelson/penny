//   _
//   (_)
//    _ ___
//   | / __|
//   | \__ \
//   | |___/
//  _/ |
// |__/

const { join, relative, resolve, extname } = require('path');
const { stat } = require('fs');
const { replaceExt } = require('./serve-utils');
const Rollup = require('rollup');
const nodeResolvePlugin = require('rollup-plugin-node-resolve');
const commonJsPlugin = require('rollup-plugin-commonjs');
const babelPlugin = require('rollup-plugin-babel');
const replacePlugin = require('rollup-plugin-replace');

///
/// SRCWARE
///

module.exports = function subWare(baseDir, changeTimes) {
  const srcExt = '.js';
  const renderCache = {};
  const renderTimes = {};
  const bundleCache = {};
  const inputConfig = {
    external: [],
    plugins: [
      nodeResolvePlugin(),
      commonJsPlugin(),
      babelPlugin(),
      replacePlugin({
        ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      })
    ]
  };
  const outputConfig = {
    format: 'es',
    sourcemap: 'inline'
  };
  // NB: we don't check reqFile vs srcFile here; they are the same
  return function(srcFile, res, next) {
    stat(srcFile, (err, stats) => {
      // bail, if srcFile does not exist
      if (err || !stats.isFile()) return next();
      const now = Date.now();
      // if renderCache invalid, re-render and update renderTime
      if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
        renderCache[srcFile] = Rollup.rollup(
          Object.assign({}, inputConfig, {
            input: srcFile,
            cache: bundleCache[srcFile]
          })
        )
          .then(bundle => {
            bundleCache[srcFile] = bundle;
            renderTimes[srcFile] = now;
            return bundle.generate(outputConfig);
          })
          .catch(next);
      }
      renderCache[srcFile].then(data => {
        console.log(
          `${srcExt} file\n changed: ${changeTimes['.pug']} \n rendered: ${
            renderTimes[srcFile]
          } \n served: ${now}`
        );
        res.setHeader('Content-Type', 'text/javascript');
        res.end(data.code);
      });
    });
  };
};
