const { relative } = require('path');
const requireResolve = require('resolve');

const { pennyLogger } = require('./util-loggers.js');

module.exports = async function(options) {

  const { srcDir, pubDir, logLevel, browserSyncOptions } = options;
  pennyLogger.info(`serving from {magenta:@/${relative(process.cwd(), pubDir)}}\n`);

  const http2Module = require(requireResolve.sync('http2', { basedir: srcDir })); // force the indy module

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
  function watchData() {}
  function watchHtml() {}
  function watchCss() {}
  function watchJs() {}

  function reloadData() {}
  function reloadHtml() {}
  function reloadCss() {}
  function reloadJs() {}

  const watchingData = await new Promise((resolve, reject) => {
    try {
      watchData(options, resolve, reloadData);
    } catch(err) {
      reject(err);
    }
  });
};
