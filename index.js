// built-in
const { relative, extname, join, resolve, dirname, basename } = require('path');
const { statSync, readFileSync } = require('fs');

// npm
const configExplorer = require('cosmiconfig')('penny', { stopDir: process.cwd() });

// local
const doServe = require('./lib/serve.js');
const doBuild = require('./lib/build.js');
const { eazyLogger, pennyLogger } = require('./lib/loggers.js');

// penny defaults
const defaults = {
  browsers: ['>1%'],
  logLevel: 'warn', // [error, info, warn, debug, trace] (ascending verbosity)
  useHTTPS: false,
  keepFiles: [],
};

// function getPubDir(srcDir, pubDirName) {
//   try {
//     const pubDir = join(srcDir, pubDirName);
//     const stats = statSync(pubDir);
//     if (!stats.isDirectory()) throw new Error();
//     return pubDir;
//   } catch (err) {
//     pennyLogger.info(`no sub-directory named ${pubDirName} was found; using source directory as web-root`);
//     return srcDir;
//   }
// }

function init(srcDir, doSomething) {
  configExplorer
    .search(srcDir)
    .then((result) => {
      const options = Object.assign({}, defaults, result ? result.config : {});
      eazyLogger.setLevel(options.logLevel);
      let pubDir = srcDir;
      if ('pubDirName' in options) {
        const { pubDirName } = options;
        try {
          pubDir = join(srcDir, options.pubDirName);
          const stats = statSync(pubDir);
          if (!stats.isDirectory()) throw new Error();
        } catch (err) {
          pennyLogger.info(`no sub-directory named ${pubDirName} was found; using source directory as web-root`);
          pubDir = srcDir;
        }
      }
      // const pubDir = getPubDir(srcDir, options.pubDirName);
      return [pubDir, options];
    })
    .then(doSomething)
    .catch(err => pennyLogger.error(err.toString()));
}

function serve(srcDir) {
  init(srcDir, ([pubDir, options]) => {
    // console.log({pubDir});
    Object.assign(options, { isDev: true, isBuild: false});
    // eazyLogger.setLevel(options.logLevel);
    // const pubDir = getPubDir(srcDir, options.pubDirName);
    doServe(srcDir, pubDir, options);
  });
}

function build(srcDir, outDir) {
  init(srcDir, ([pubDir, options]) => {
    // console.log({pubDir});
    Object.assign(options, { isDev: process.env.NODE_ENV == 'development', isBuild: true});
    // eazyLogger.setLevel(options.logLevel);
    // const pubDir = getPubDir(srcDir, options.pubDirName);
    doBuild(srcDir, pubDir, outDir, options);
  });
}

module.exports = { serve, build };
