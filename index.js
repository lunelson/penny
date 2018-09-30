// built-in
const { join } = require('path');
const { statSync } = require('fs');
// npm
const configExplorer = require('cosmiconfig')('penny', { stopDir: process.cwd() });
// local
const doServe = require('./lib/serve.js');
const doBuild = require('./lib/build.js');
const { eazyLogger, pennyLogger } = require('./lib/loggers.js');

// penny defaults
const defaults = {
  logLevel: 'warn', // [error, info, warn, debug, trace] (ascending verbosity)
  browsers: ['>1%'],
  keepFiles: [],
  include: [],
  exclude: [],
  baseUrl: '',
  webRoot: '',
  // browserSyncOptions: null, // NB we are only accepting *some* options here; see serve.js
  // markdownItOptions: null,
  // markdownItPlugins: null,
  // posthtmlPlugins: null,
  // postcssPlugins: null,
};

// TODO: make this search only for specific config file types?
function init(srcDir, doAction) {
  configExplorer
    .search(srcDir)
    .then((result) => {
      const options = Object.assign({}, defaults, result ? result.config : {});
      eazyLogger.setLevel(options.logLevel);
      let pubDir = srcDir;
      if ('webRoot' in options) {
        const { webRoot } = options;
        try {
          pubDir = join(srcDir, options.webRoot);
          const stats = statSync(pubDir);
          if (!stats.isDirectory()) throw new Error();
        } catch (err) {
          pennyLogger.info(`no sub-directory named ${webRoot} was found; using source directory as web-root`);
          pubDir = srcDir;
        }
      } else {
        pennyLogger.info('no webRoot in options');
      }
      return [pubDir, options];
    })
    .then(doAction)
    .catch(err => pennyLogger.error(err.toString()));
}

function serve(srcDir) {
  init(srcDir, ([pubDir, options]) => {
    Object.assign(options, { isDev: true, isBuild: false});
    doServe(srcDir, pubDir, options);
  });
}

function build(srcDir, outDir) {
  init(srcDir, ([pubDir, options]) => {
    Object.assign(options, { isDev: process.env.NODE_ENV == 'development', isBuild: true});
    doBuild(srcDir, pubDir, outDir, options);
  });
}

module.exports = { serve, build };
