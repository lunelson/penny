const doServe = require('./lib/serve.js');
const doBuild = require('./lib/build.js');
const { eazyLogger, pennyLogger } = require('./lib/loggers.js');

// const stopDir = process.cwd();
const configExplorer = require('cosmiconfig')('penny', { stopDir: process.cwd() });

const options = {
  browsers: ['>1%'],
  logLevel: 'warn', // [error, info, warn, debug, trace] (ascending verbosity)
  isHTTPS: false,
  // pretty: true // TODO: make this default to isDev, but overridable
};

function init(srcDir, doSomething) {
  configExplorer
    .search(srcDir)
    .then((result) => result ? result.config : {})
    .then(doSomething)
    .catch(err => pennyLogger.error(err.toString()));
}

function serve(srcDir) {
  init(srcDir, (rcOptions) => {
    Object.assign(options, rcOptions, { isDev: true, isBuild: false});
    eazyLogger.setLevel(options.logLevel);
    doServe(srcDir, options);
  });
  // configExplorer
  //   .search(stopDir)
  //   .then((result) => result ? result.config : {})
  //   .then((rcOptions) => {
  //   }).catch(err => pennyLogger.error(err.toString()));
}

function build(srcDir, outDir) {
  init(srcDir, (rcOptions) => {
    Object.assign(options, rcOptions, { isDev: process.env.NODE_ENV == 'development', isBuild: true});
    eazyLogger.setLevel(options.logLevel);
    doBuild(srcDir, outDir, options);
  });
  // configExplorer
  //   .search(stopDir)
  //   .then((result) => result ? result.config : {})
  //   .then((rcOptions) => {
  //     Object.assign(options, rcOptions, { isDev: process.env.NODE_ENV == 'development', isBuild: true});
  //     eazyLogger.setLevel(options.logLevel);
  //     doBuild(srcDir, outDir, options);
  //   }).catch(err => pennyLogger.error(err.toString()));
}

module.exports = { serve, build };
