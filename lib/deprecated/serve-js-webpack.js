/*
  WEBPACK plans

  - per srcFile, create a compiler -> merge srcFile opts against webpackBaseConfig
  - set the outputFileSystem to MemoryFS, e.g. https://webpack.js.org/api/node/#custom-file-systems
  - when renderCache needs refresh, do compiler.run -- see also link above
  - see this as example of a baseCOnfig https://medium.com/netscape/webpack-3-react-production-build-tips-d20507dba99a
  - make sure tree-shaking, dead-code-removal are active https://webpack.js.org/guides/tree-shaking/
  - make sure scope-hoisting is active https://medium.com/webpack/brief-introduction-to-scope-hoisting-in-webpack-8435084c171f
  - note from this explanation, publicPath should be the relative(baseDir, reqFile) path https://github.com/webpack/docs/wiki/webpack-dev-server
  - note that webpack-base probably needs to return a unique object; could be a function that accepts options, and does the merging internally
  - ** check out the header processing in webpack-dev-middleware https://github.com/webpack/webpack-dev-middleware


*/

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
const rollupEslint = require('./util/rollup-eslint');
const rollupResolve = require('rollup-plugin-node-resolve');
const rollupCommonJS = require('rollup-plugin-commonjs');
const rollupReplace = require('rollup-plugin-replace');
const rollupBabel = require('rollup-plugin-babel'); // upgrade to babel 7: npm install --save-dev rollup-plugin-babel@next
const rollupUglify = require('rollup-plugin-uglify');
// const rollupSizes = require('rollup-plugin-sizes');
// const { minify:esMinifier } = require('uglify-es');

// BABEL
const babelExternal = require('babel-plugin-external-helpers');
const babelResolver = require('babel-plugin-module-resolver');
const babelSyntaxORS = require('babel-plugin-syntax-object-rest-spread');
const babelTransformORS = require('babel-plugin-transform-object-rest-spread');

/*
  OBJECT REST SPREAD ISSUE
  - babel might work with transform-object-rest-spread;
    might require other plugins first as here https://github.com/babel/babel-preset-env/issues/326#issuecomment-329819474
    or might require babel 7
  - however the main problem is that rollup is failing on object-rest-spread right now, regardless of babel

  ALTERNATIVE: WEBPACK
  - simplest might be to jump to webpack 3, babel-loader 8
    https://github.com/babel/babel-eslint
    https://github.com/MoOx/eslint-loader
    https://github.com/babel/babel-loader

*/

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

  const userEslintConfig = {};
  const baseEslintConfig = {
    'env': {
      'browser': true,
      'es6': true
    },
    // 'extends': [
    //   'eslint:recommended',
    //   'plugin:import/errors',
    //   'plugin:import/warnings'
    // ],
    'parserOptions': {
      'sourceType': 'module',
      'ecmaFeatures': {
        'experimentalObjectRestSpread': true
      }
    },
    // 'settings': {
    //   'import/resolver': {
    //     'babel-module': {
    //       'alias': { '~': '.' }
    //     }
    //   }
    // },
    'rules': {
      'for-direction': ['error'],
      'getter-return': ['error', { 'allowImplicit': true }],
      'no-await-in-loop': ['error'],
      'no-compare-neg-zero': ['error'],
      'no-cond-assign': ['error', 'except-parens'],
      // 'no-console': ['error'],
      // 'no-constant-condition': ['error'],
      'no-control-regex': ['error'],
      // 'no-debugger': ['error'],
      'no-dupe-args': ['error'],
      'no-dupe-keys': ['error'],
      'no-duplicate-case': ['error'],
      // 'no-empty': ['error'],
      'no-empty-character-class': ['error'],
      'no-ex-assign': ['error'],
      'no-extra-boolean-cast': ['error'],
      'no-extra-parens': ['error'],
      'no-extra-semi': ['error'],
      'no-func-assign': ['error'],
      'no-inner-declarations': ['error'],
      'no-invalid-regexp': ['error'],
      'no-irregular-whitespace': ['error', { 'skipComments': true }],
      'no-obj-calls': ['error'],
      // 'no-prototype-builtins': ['error'],
      'no-regex-spaces': ['error'],
      'no-sparse-arrays': ['error'],
      'no-template-curly-in-string': ['error'],
      'no-unexpected-multiline': ['error'],
      // 'no-unreachable': ['error'],
      'no-unsafe-finally': ['error'],
      'no-unsafe-negation': ['error'],
      'use-isnan': ['error'],
      // 'valid-jsdoc': ['error'],
      'valid-typeof': ['error'],
    }
  };

  const ENV = JSON.stringify(isDev?'development':'production');
  const inputConfig = {
    external: [],
    plugins: [
      rollupEslint({
        fix: true,
        formatter: 'codeframe',
        useEslintrc: false,
        throwOnError: true,
        throwOnWarning: true,
        baseConfig: Object.assign(baseEslintConfig, userEslintConfig),
      }),
      /* NB this is atm the canonical ordering for these common plugins; could change in the future */
      rollupResolve({ module: true, jsnext: true, main: true }),
      rollupReplace({ 'process.env.NODE_ENV': ENV, 'NODE_ENV': ENV, 'ENV': ENV }), // before commonJS: correct?
      rollupCommonJS({ sourceMaps: isDev }),
      rollupBabel({
        babelrc: false,
        exclude: '**/node_modules/**',
        sourceMaps: isDev,
        presets: [
          [babelPresetEnv, {
            modules: false,
            // debug: isDev,
            targets: { browsers },
            useBuiltIns: true, // a 'usage' option will be in Babel 7
            // include: [ 'transform-es2015-destructuring', 'transform-es2015-parameters' ]
          }]
        ],
        plugins: [babelSyntaxORS, [babelTransformORS, { useBuiltIns: true }], babelExternal, [babelResolver, { alias: { '~': relDir.length?`./${relDir}`:'.' } }]]
      }),
      !isDev && rollupUglify()
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
            return bundle.generate({ file: srcFile, output: outputConfig });
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
