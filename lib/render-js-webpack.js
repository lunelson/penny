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

const Webpack = require('webpack');
const memoryFs = new (require('memory-fs'))();
const webpackConfig = require('./util/config-webpack');

class PrepCache {
  constructor(prepFn) {
    this.prepFn = prepFn;
    this.cache = Object.create(null);
  }
  get(id, ...rest) {
    if (!(id in this.cache)) this.cache[id] = this.prepFn(id, ...rest);
    return this.cache[id];
  }
}

const compilerCache = new PrepCache((srcFile, reqFile, options) => {
  const compiler = new Webpack(webpackConfig(srcFile, reqFile, options));
  compiler.outputFileSystem = memoryFs;
  return compiler;
});

// local

module.exports = function(baseDir, isDev, options) {

  const doLinting = options.linting && options.eslintConfig;

  return function(srcFile, renderTimes) {
    const reqFile = srcFile.replace(/\s/,''); // should replace srcExt with reqExt
    const compiler = compilerCache.get(srcFile, reqFile, options);
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) reject({err});
        else if (stats.hasErrors()||stats.hasWarnings()) reject({stats});
        else resolve(memoryFs.readFileSync(reqFile));
      }).then((data) => {
        // set renderCache
        // set renderTimes
        // return code
      }).catch(({err, stats}) => {
        // log
        // set renderTimes
        // return jsCssError(message);
        if (err) {
          console.error(err.stack || err);
          if (err.details) {
            console.error(err.details);
          }
          return;
        }

        const info = stats.toJson();

        if (stats.hasErrors()) {
          console.error(info.errors);
        }

        if (stats.hasWarnings()) {
          console.warn(info.warnings);
        }
      });
    });
  };
};
