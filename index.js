const doServe = require('./lib/serve.js');
const doBuild = require('./lib/build.js');
const logger = require('./lib/logger.js');

const configExplorer = require('cosmiconfig')('penny', { stopDir: process.cwd()});

const options = {
  browsers: ['>1%'],
  logLevel: 'warn', // [error, info, warn, debug, trace] (ascending verbosity)
  isHTTPS: false
};

function serve(srcDir) {
  configExplorer
    .search(srcDir)
    .then((result) => result ? result.config : {})
    .then((rcOptions) => {
      Object.assign(options, rcOptions, { isDev: true, isBuild: false});
      doServe(srcDir, options);
    }).catch(err => logger.penny.error(err.toString()));
}

function build(srcDir, outDir) {
  configExplorer
    .search(srcDir)
    .then((result) => result ? result.config : {})
    .then((rcOptions) => {
      Object.assign(options, rcOptions, { isDev: process.env.NODE_ENV == 'development', isBuild: true});
      doBuild(srcDir, outDir, options);
    }).catch(err => logger.penny.error(err.toString()));
}

module.exports = { serve, build };
