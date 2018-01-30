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
const { jsLogger } = require('./loggers');
// const { jsCssErr } = require('./errors');

// BABEL
// const babelExternal = require('babel-plugin-external-helpers');
// const babelResolver = require('babel-plugin-module-resolver');

// const babelPluginORS = require('@babel/plugin-proposal-object-rest-spread');
// const babelPresetEnv = require('@babel/preset-env');

// const webpack = require('webpack');
// const memoryFs = new (require('memory-fs'))();

// const configureEslint = require('./util/config-eslint');
// const configureWebpack = require('./util/config-webpack');

// class PrepCache {
//   constructor(prepFn) {
//     this.prepFn = prepFn;
//     this.cache = Object.create(null);
//   }
//   get(id, ...rest) {
//     if (!(id in this.cache)) this.cache[id] = this.prepFn(id, ...rest);
//     return this.cache[id];
//   }
// }

// const compilerCache = new PrepCache((srcFile, reqFile, options) => {
//   // alt way to create compiler: https://webpack.js.org/api/compiler/
//   const compiler = webpack(configureWebpack(srcFile, reqFile, options));
//   compiler.outputFileSystem = memoryFs;
//   return compiler;
// });

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


///
/// EXPORT
///

module.exports = function (baseDir, isDev, changeTimes, options) {
  const procDir = process.cwd();
  const relDir = relative(procDir, baseDir);
  const { browsersList: browsers, linting } = options;

  const srcExt = '.js';
  const renderCache = {};
  const renderTimes = {};
  const renderFn = require(`./render-${srcExt.slice(1)}.js`)(baseDir, isDev, options);

  // NB: we don't check reqFile vs srcFile here; they are the same
  return function (srcFile, res, next) {
    stat(srcFile, (err, stats) => {

      // bail, if srcFile does not exist
      if (err || !stats.isFile()) return next();
      const now = Date.now();
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');

      // if the renderCache is invalid, re-render Promise and update renderTime
      if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
        renderCache[srcFile] = renderFn(srcFile, renderTimes);
      }

      // resolve renderCache, then serve
      renderCache[srcFile].then(data => {
        jsLogger(
          `${relative(baseDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${
            renderTimes[srcFile]
          } \nserved: ${now}`
        );
        // let { code, map } = data;
        // if (map) { code += `\n//# ${'sourceMa'+'ppingURL'}=${map.toUrl()}\n`; }
        // res.end(code);
        res.end(data);
      });
    });
  };
};
