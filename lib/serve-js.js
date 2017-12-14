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
const { merge } = require('./utils');
const { jsCssErr, cssEsc } = require('./errors');

// NOTE: consider including node builtins?
//       https://github.com/calvinmetcalf/rollup-plugin-node-builtins
//       https://github.com/calvinmetcalf/rollup-plugin-node-globals

const Rollup = require('rollup');
const rollupGlobals = require('rollup-plugin-node-globals');
const rollupBuiltins = require('rollup-plugin-node-builtins');
const rollupResolve = require('rollup-plugin-node-resolve');
const rollupCommonJS = require('rollup-plugin-commonjs');
const rollupJSON = require('rollup-plugin-json');
const rollupBabel = require('rollup-plugin-babel');
const rollupUglify = require('rollup-plugin-uglify');
const { minify:esMinifier } = require('uglify-es');
// const rollupAlias = require('rollup-plugin-alias');
// const rollupReplace = require('rollup-plugin-replace');

const babelExternal = require('babel-plugin-external-helpers');
const babelResolver = require('babel-plugin-module-resolver');
// const babelRootImport = require('babel-plugin-root-import');

const babelPresetEnv = require('babel-preset-env');
const babelPresetST3 = require('babel-preset-stage-3');
// const babelPresetMinify = require('babel-preset-minify');

const { jsLogger } = require('./loggers');

///
/// EXPORT
///

module.exports = function (baseDir, isDev, changeTimes, options) {
  const procDir = process.cwd();
  const relDir = relative(procDir, baseDir);
  const { browsersList:browsers } = options;
  const srcExt = '.js';
  const renderCache = {};
  const renderTimes = {};
  const bundleCache = {};

  const inputConfig = {
    external: [],
    plugins: [
      // rollupAlias({'~':`./${relDir}`}),
      rollupResolve({ jsnext: true, main: true, browser: true }), // see lengstorf tutorial
      // rollupJSON(),
      rollupCommonJS({
        sourceMaps: isDev // sourceMap(s)?
      }),
      // rollupReplace({
      //   'process.env.NODE_ENV': JSON.stringify(isDev?'development':'production'),
      //   'NODE_ENV': JSON.stringify(isDev?'development':'production'),
      //   'ENV': JSON.stringify(isDev?'development':'production'),
      // }),
      // linting && eslintRC && rollupEslint({ exclude: '**/node_modules/**' }),
      rollupBabel({
        babelrc: false,
        exclude: '**/node_modules/**',
        sourceMaps: isDev,
        presets: [
          [babelPresetEnv, {
            modules: false,
            targets: { browsers },
            useBuiltIns: true // a 'usage' option will be in Babel 7
          }],
          // babelPresetST3
        ],
        // NOTE: trying out babelResolver here as alternate to the root import plugin
        plugins: [babelExternal, [babelResolver, { alias: { '~':`${relDir.length?`./${relDir}`:'.'}` } }]]
        // plugins: [babelExternal, [babelRootImport.default, { rootPathSuffix: relDir }]]
      }),
      !isDev && rollupUglify({}, esMinifier)
    ]/* .concat(isDev?[]:[rollupUglify({}, esMinifier)]) */
  };

  const outputConfig = {
    format: 'es',
    sourcemap: isDev,
    intro: '"use-strict;"'
    // intro: `'use-strict'; window.ENV = '${isDev?'development':'production'}';`
  };

  // NB: we don't check reqFile vs srcFile here; they are the same
  return function (srcFile, res, next) {
    stat(srcFile, (err, stats) => {

      // bail, if srcFile does not exist
      if (err || !stats.isFile()) return next();
      const now = Date.now();
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');

      // if the renderCache is invalid, re-render Promise and update renderTime
      if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
        /*
          ARGS
          file, cache, isDev
          srcFile, bundleCache[srcFile]
          eslintPlugin IF eslintrc is present -> feed eslintrc
        */
        renderCache[srcFile] = Rollup.rollup(
          merge(inputConfig, {
            input: srcFile,
            cache: bundleCache[srcFile]
          })
        )
          .then(bundle => {
            bundleCache[srcFile] = bundle;
            renderTimes[srcFile] = now;
            return bundle.generate(merge(outputConfig, { file: srcFile }));
          })
          .catch((err) => {
            jsLogger(err);
            renderTimes[srcFile] = now;
            return err;
          });
      }

      /*
        renderCache[srcFile] = RENDER(srcFile, isDev, bundleCache, () => {
          renderTimes[srcFile] = now;
        })

        renderCache[srcFile] = RENDER(srcFile, isDev, bundleCache, renderTimes)

      */

      // resolve renderCache, then serve
      renderCache[srcFile].then(data => {
        jsLogger(
          `${relative(baseDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${
            renderTimes[srcFile]
          } \nserved: ${now}`
        );

        // output error, if there was one
        if ('message' in data) {
          res.end(jsCssErr(data.message, '#E6EEF2'));
        }

        // else attach the sourcemap and send
        let { code, map } = data;
        if (map) { code += `\n//# ${'sourceMa'+'ppingURL'}=${map.toUrl()}\n`; }
        res.end(code);
      });
    });
  };
};
