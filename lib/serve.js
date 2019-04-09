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

  watchingData
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

  const watchingData = await watchData(options, reloadData);
  pennyLogger.info('data watcher is ready');

  // const watchingRoutes = await watchRoutes(options, reloadData);
  // pennyLogger.info('route watcher is ready');

  // typeof onStart === 'function' && onStart({ $data, $routes }, options);

  // const http2Module = require(requireResolve.sync('http2', { basedir: srcDir })); // force the indy module
};
