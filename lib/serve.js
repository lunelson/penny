const path = require('path');
const __basename = path.basename(__filename);

const requireResolve = require('resolve');
const bsync = require('browser-sync').create();
const serveFavicon = require('serve-favicon')(`${__dirname}/favicon.ico`);

const { $data, watchData, $routes, watchRoutes } = require('./watch-data');
const { pennyLogger } = require('./util-loggers.js');

module.exports = async function(options) {
  const { srcDir, pubDir, logLevel, browserSyncOptions, onStart } = options;

  pennyLogger.info(`serving from {magenta:@/${path.relative(process.cwd(), pubDir)}}`);

  /*
  watchData
  watchHtml
  watchCss
  watchJs

  dataWatcher
  watchingHtml
  watchingCss
  watchingJs

  reloadData
  reloadHtml
  reloadCss
  reloadJs
  */

  function watchHtml() {}
  function watchCss() {}
  function watchJs() {}

  function reloadData() {
    // console.log('data event received in SERVE');
  }
  function reloadHtml() {}
  function reloadCss() {}
  function reloadJs() {}

  // browser-sync reloading
  let reloadTimeout;
  const reloadExts = new Set();
  function bsyncReload(...exts) {
    exts.forEach(ext => reloadExts.add(ext));
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      bsync.reload([...reloadExts].map(ext => `*${ext}`));
      reloadTimeout = null;
      reloadExts.clear();
    }, 100);
  }

  /*
    TODO
    - have watchData attach $data to the options object
    - have watchSrc attach $pages to the options object
    - have watchSrc pick up the onStart handler and run it there, feeding $data and $pages
  */

  // returns chokidar watcher instance
  const dataWatcher = await watchData(options, dataFile => {
    // srcCompilers.filter(isHTML).forEach =>
    // delete compiler.outCache
    // bSyncRefresh('.html')
  });

  pennyLogger.info('data watcher is ready');

  // returns chokidar watcher instance
  const routeWatcher = await watchRoutes(options, (srcFile, srcCompilers) => {
    // srcCompilers.forEach
    // if compiler depends on srcFile -> delete compiler template; add compiler outExt to refresh
    // else if compiler is HTML and srcFile is HTML -> delete compiler cache; add html to refresh
    // bsyncRefresh(refreshExts)
  });

  pennyLogger.info('route watcher is ready');

  // typeof onStart === 'function' && onStart({ $data, $routes }, options);

  // const http2Module = require(requireResolve.sync('http2', { basedir: srcDir })); // force the indy module
};
