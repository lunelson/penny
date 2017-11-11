//   _
//   (_)
//    _ ___
//   | / __|
//   | \__ \
//   | |___/
//  _/ |
// |__/

const { stat } = require('fs');
// const { join, relative, resolve, extname } = require('path');
const { /* replaceExt, */ browsersList, merge } = require('./serve-utils');
const debug = require('debug');

const Rollup = require('rollup');
const nodeResolvePlugin = require('rollup-plugin-node-resolve');
const commonJsPlugin = require('rollup-plugin-commonjs');
const babelPlugin = require('rollup-plugin-babel');
const replacePlugin = require('rollup-plugin-replace');
const logger = debug('penguin:js');

const inputConfig = {
  external: [],
  plugins: [
    nodeResolvePlugin(),
    commonJsPlugin(),
    babelPlugin({
      exclude: 'node_modules/**',
      presets: [
        [
          'env',
          {
            modules: false,
            targets: { browsers: browsersList }
          }
        ]
      ],
      plugins: ['external-helpers']
    }),
    replacePlugin({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ]
};
const outputConfig = {
  format: 'es',
  sourcemap: 'inline' // TODO: only if in DEV mode
};

///
/// EXPORT
///

module.exports = function(baseDir, changeTimes) {
  const srcExt = '.js';
  const renderCache = {};
  const renderTimes = {};
  const bundleCache = {};

  // NB: we don't check reqFile vs srcFile here; they are the same
  return function(srcFile, res, next) {
    stat(srcFile, (err, stats) => {
      // bail, if srcFile does not exist
      if (err || !stats.isFile()) return next();
      const now = Date.now();
      res.setHeader('Content-Type', 'text/javascript');

      // if the renderCache is invalid, re-render Promise and update renderTime
      if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
        renderCache[srcFile] = Rollup.rollup(
          merge(inputConfig, {
            input: srcFile,
            cache: bundleCache[srcFile]
          })
        )
          .then(bundle => {
            bundleCache[srcFile] = bundle;
            renderTimes[srcFile] = now;
            return bundle.generate(outputConfig);
          })
          .catch(next); // TODO error handling which will display on screen, or use bsync.notify
      }

      // resolve renderCache, then serve
      renderCache[srcFile].then(data => {
        logger(
          `${srcExt} file\n changed: ${changeTimes[srcExt]} \n rendered: ${
            renderTimes[srcFile]
          } \n served: ${now}`
        );
        res.end(data.code);
      });
    });
  };
};
