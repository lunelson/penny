//                     _                  _
//                    | |                (_)
//  _ __ ___ _ __   __| | ___ _ __ ______ _ ___
// | '__/ _ \ '_ \ / _` |/ _ \ '__|______| / __|
// | | |  __/ | | | (_| |  __/ |         | \__ \
// |_|  \___|_| |_|\__,_|\___|_|         | |___/
//                                      _/ |
//                                     |__/

// node

// npm

/*
  createWebpackConfig(srcFile, reqFile, options)
  createEslintConfig()
  shimPug(locals)
  shimSCSS(locals)

*/

const webpack = require('webpack');
const memoryFs = new (require('memory-fs'))();
const { jsLogger } = require('./loggers');
const { PrepCache } = require('./utils');
const { jsCssErr } = require('./errors');


// export
module.exports = function({srcDir, loggerFn, options}) {

  const { isDev, isBuild } = options;

  /* WEBPACK CONFIG and COMPILER-CACHE

  */
  // TODO: add linting
  // const doLinting = options.linting && options.eslintConfig;
  const configureWebpack = require('./util/config-webpack')(srcDir, isDev, options);
  const compilerCache = new PrepCache((srcFile) => {
    // NB: consider this alternate way to create compiler https://webpack.js.org/api/compiler/
    const compiler = webpack(configureWebpack(srcFile));
    compiler.outputFileSystem = memoryFs;
    return compiler;
  });

  return function(srcFile) {

    const compiler = compilerCache.get(srcFile);
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) reject({err}); // only for webpack errors e.g. misconfig
        else if (stats.hasErrors()||stats.hasWarnings()) reject({stats});
        else resolve(memoryFs.readFileSync(srcFile)); // consider using readFile(srcFile, (err, data) => {/**/}) here
      });
    })


      .then((data) => data)
      .catch(({err, stats}) => {

        let message;
        if (err) {
          message = err.stack || err;
          if (err.details) { message = err.details; }
          if (isBuild) throw Error(message);
          return jsCssErr(message);
        }
        // the options for this are documented here https://webpack.js.org/configuration/stats/
        const info = stats.toJson({/* options */});
        // const info = stats.toString({/* options */}); // this includes "color": true|false for console colors
        if (stats.hasErrors()) { message = info.errors; }
        if (stats.hasWarnings()) { message = info.warnings; }
        if (isBuild) throw Error(message);
        loggerFn.error(message);
        return jsCssErr(message);
      });
  };
};
