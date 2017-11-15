//   _
//   (_)
//    _ ___
//   | / __|
//   | \__ \
//   | |___/
//  _/ |
// |__/

const { stat } = require('fs');
const { join, relative, resolve, extname } = require('path');
const { /* replaceExt, */ merge } = require('./serve-utils');
const debug = require('debug');

const Rollup = require('rollup');
const nodeResolvePlugin = require('rollup-plugin-node-resolve');
const commonJsPlugin = require('rollup-plugin-commonjs');
const babelPlugin = require('rollup-plugin-babel');
// const replacePlugin = require('rollup-plugin-replace');
const logger = debug('penguin:js');


///
/// EXPORT
///

module.exports = function (baseDir, isDev, changeTimes, options) {
  const procDir = process.cwd();
  const relDir = relative(procDir, baseDir);
  console.log(`baseDir relative to procDir is ${relDir}`);
  const { browsersList:browsers } = options;
  const srcExt = '.js';
  const renderCache = {};
  const renderTimes = {};
  const bundleCache = {};

  const inputConfig = {
    external: [],
    plugins: [
      nodeResolvePlugin(),
      commonJsPlugin(),
      babelPlugin({
        exclude: '**/node_modules/**',
        presets: [
          [ 'env', {
            modules: false,
            targets: { browsers },
            useBuiltIns: true // a 'usage' option will be in Babel 7
          } ],
          'stage-3'].concat(isDev?[['minify', {}]]:[]),
        plugins: ['external-helpers', ['babel-plugin-root-import', { 'rootPathSuffix': relDir }]]
      })
    ]
  };
  const outputConfig = {
    format: 'es',
    intro: `window.ENV = ${isDev?'development':'production'};`,
    sourcemap: 'inline' // TODO: only if in DEV mode
  };

  // NB: we don't check reqFile vs srcFile here; they are the same
  return function (srcFile, res, next) {
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
          .catch((err) => {
            logger(err)
            renderTimes[srcFile] = now;
            return err;
          });
      }
      // resolve renderCache, then serve
      renderCache[srcFile].then(data => {
        logger(
          `${srcExt} file\nchanged: ${changeTimes[srcExt]} \nrendered: ${
            renderTimes[srcFile]
          } \nserved: ${now}`
        );
        res.end(data.message || data.code);
      });
    });
  };
};