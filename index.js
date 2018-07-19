const doServe = require('./lib/serve.js');
const doBuild = require('./lib/build.js');
const { eazyLogger, pennyLogger } = require('./lib/logger.js');

const stopDir = process.cwd();
const configExplorer = require('cosmiconfig')('penny', { stopDir });

const options = {
  browsers: ['>1%'],
  logLevel: 'warn', // [error, info, warn, debug, trace] (ascending verbosity)
  isHTTPS: false
};

function serve(srcDir) {
  configExplorer
    .search(stopDir)
    .then((result) => result ? result.config : {})
    .then((rcOptions) => {
      console.log(rcOptions);
      Object.assign(options, rcOptions, { isDev: true, isBuild: false});
      eazyLogger.setLevel(options.logLevel);
      doServe(srcDir, options);
    }).catch(err => pennyLogger.error(err.toString()));
}

function build(srcDir, outDir) {
  configExplorer
    .search(stopDir)
    .then((result) => result ? result.config : {})
    .then((rcOptions) => {
      console.log(rcOptions);
      Object.assign(options, rcOptions, { isDev: process.env.NODE_ENV == 'development', isBuild: true});
      eazyLogger.setLevel(options.logLevel);
      doBuild(srcDir, outDir, options);
    }).catch(err => pennyLogger.error(err.toString()));
}

module.exports = { serve, build };
