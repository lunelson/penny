//  _ __   ___ _ __  _ __  _   _
// | '_ \ / _ \ '_ \| '_ \| | | |
// | |_) |  __/ | | | | | | |_| |
// | .__/ \___|_| |_|_| |_|\__, |
// | |                      __/ |
// |_|                     |___/

const { join, relative } = require('path');
const { statSync } = require('fs');

const { cosmiconfig } = require('cosmiconfig');

const { pennyLogger } = require('./lib/util-loggers.js');
const doServe = require('./lib/serve.js');
const doBuild = require('./lib/build.js');

//#region setup

// penny defaults
const defaults = {
  logLevel: 'warn', // [error, info, warn, debug, trace] (ascending verbosity)
  browsers: ['>1%'],
  webRoot: '',
  baseUrl: '',
  keepFiles: [],
  include: [],
  exclude: [],

  browserSyncOptions: null, // NB we are only accepting *some* options here; see serve.js
};

// penny config explorer
const configExplorer = cosmiconfig('penny', {
  stopDir: process.cwd(),
  // searchPlaces: ['package.json', '.pennyrc', 'penny.config.js'], // these are pretty much the defaults anyway !
});

//#endregion

async function init(srcDir, cb) {
  const { filepath: configFile = '', config = {} } = await configExplorer.search(srcDir);
  const options = Object.assign({}, defaults, config);

  pennyLogger.setLevel(options.logLevel);

  if (configFile) {
    pennyLogger.info(`using config file {magenta:@/${relative(process.cwd(), configFile)}}`);
  } else {
    pennyLogger.info('no config file found; using default config');
  }
  pennyLogger.debug('{yellow:index.js}: merged configuration:\n', options);

  let pubDir = srcDir;
  const { webRoot } = options;

  if (webRoot.length) {
    try {
      pubDir = join(srcDir, webRoot);
      const stats = statSync(pubDir);
      if (!stats.isDirectory()) throw new Error();
    } catch (err) {
      pennyLogger.warn(`webRoot sub-directory {magenta:${webRoot}} not found`);
      pubDir = srcDir;
    }
  }

  Object.assign(options, { srcDir, pubDir });
  cb(options);
}

function serve(srcDir) {
  init(srcDir, options => {
    Object.assign(options, { isDev: true, isBuild: false });
    doServe(options);
  });
}

function build(srcDir, outDir) {
  init(srcDir, options => {
    Object.assign(options, { isDev: false, isBuild: true, outDir });
    doBuild(options);
  });
}

module.exports = { serve, build };
