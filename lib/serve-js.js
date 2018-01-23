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
const { jsCssErr } = require('./errors');

// REJECTED
// const rollupGlobals = require('rollup-plugin-node-globals'); // adds node globals
// const rollupBuiltins = require('rollup-plugin-node-builtins'); // adds node built-ins
// const rollupJSON = require('rollup-plugin-json'); // resolves JSON files as if every top-level key was an ESM export
// const rollupAlias = require('rollup-plugin-alias'); // should alias imports; doesn't seem to be super reliable

// ROLLUP
const Rollup = require('rollup');
const rollupResolve = require('rollup-plugin-node-resolve');
const rollupCommonJS = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const rollupBabel = require('rollup-plugin-babel'); // upgrade to babel 7: npm install --save-dev rollup-plugin-babel@next
const rollupUglify = require('rollup-plugin-uglify');
// const rollupSizes = require('rollup-plugin-sizes');
const { minify:esMinifier } = require('uglify-es');

// BABEL
const babelExternal = require('babel-plugin-external-helpers');
const babelResolver = require('babel-plugin-module-resolver');
const babelPresetEnv = require('babel-preset-env');

const { jsLogger } = require('./loggers');

///
/// EXPORT
///

module.exports = function (baseDir, isDev, changeTimes, options) {
  const procDir = process.cwd();
  const relDir = relative(procDir, baseDir);
  const { browsersList:browsers, linting } = options;
  const srcExt = '.js';
  const renderCache = {};
  const renderTimes = {};
  const bundleCache = {};

  const ENV = JSON.stringify(isDev?'development':'production');
  const inputConfig = {
    external: [],
    plugins: [
      /* NB this is atm the canonical ordering for these common plugins; could change in the future */
      rollupResolve({ module: true, jsnext: true, main: true }),
      rollupReplace({ 'process.env.NODE_ENV': ENV, 'NODE_ENV': ENV, 'ENV': ENV }), // before commonJS: correct?
      rollupCommonJS({ sourceMaps: isDev }),
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
          }]
        ],
        plugins: [babelExternal, [babelResolver, { alias: { '~': relDir.length?`./${relDir}`:'.' } }]]
      }),
      !isDev && rollupUglify({}, esMinifier)
    ],
    onwarn(warning) {
      const { code, loc, frame, message } = warning;
      const noThrow = [
        'EMPTY_BUNDLE',
        'UNUSED_EXTERNAL_IMPORT',
      ];

      if (!noThrow.indexOf(code)) return;

      else if (loc) {
        console.log(`${loc.file} (${loc.line}:${loc.column}) ${message}`);
        throw new Error(`${loc.file} (${loc.line}:${loc.column}) ${message}`);
      } else if (message) {
        console.log(message);
        throw new Error(message);
      } else {
        console.log(warning);
        throw new Error(warning);
      }
    }
  };

  const outputConfig = {
    format: 'es',
    sourcemap: isDev,
    intro: '\'use-strict\';'
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
            throw(err);
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
        // if ('message' in data) {
        //   res.end(jsCssErr(data.message, '#E6EEF2'));
        // }

        // else attach the sourcemap and send
        let { code, map } = data;
        if (map) { code += `\n//# ${'sourceMa'+'ppingURL'}=${map.toUrl()}\n`; }
        res.end(code);
      }).catch(err => {
        res.end(jsCssErr(err.toString(), '#E6EEF2'));
      });
    });
  };
};
