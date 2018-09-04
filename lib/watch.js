const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');

const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const junk = require('junk');

const { pennyLogger } = require('./loggers.js');

const {
  bundleCache,
  memoryFs,
  $dataSyncer,
  $pagesSyncer
} = require('./caches.js');

const {
  // utils
  Deferral,
  removeExt,
  replaceExt,
  // file extname stuff
  outExtContentTypes,
  outSrcExts,
  srcOutExts,
  dataExts,
  // file globs
  dataGlob,
  allSrcGlob,
  cssSrcGlob,
  htmlSrcGlob,
  // bsync/connect stuff
  fileEventNames,
  bsync,
  inject,
  serveFavicon,
  serveStaticOptions,
} = require('./misc-penny.js');

function dataWatch(baseDir) {
  const dataTreeSync = $dataSyncer(baseDir);
  console.dir({dataGlob});
  return function(onReady, onEvent) {
    return bsync.watch([dataGlob], {
      cwd: baseDir
    }, (fsEvent, relFile) => {
      dataTreeSync(fsEvent, relFile);
      pennyLogger.debug('calling back from dataWatch');
      onEvent && onEvent(fsEvent, relFile);
    }).on('ready', onReady);
  };
}

function pageWatch(baseDir) {
  const pagesMapSync = $pagesSyncer(baseDir);
  return function(onReady, onEvent) {
    return bsync.watch([htmlSrcGlob], {
      // TODO: review; disallow only _file, not _folder/file ?
      ignored: ['**/node_modules/**', '_data/**', '**/_*.*'],
      cwd: baseDir
    }, (fsEvent, relFile) => {
      if (anymatch([junk.regex], basename(relFile))) return;
      if (!~fileEventNames.indexOf(fsEvent)) return;
      pagesMapSync(fsEvent, relFile);
      pennyLogger.debug('calling back from pageWatch');
      onEvent && onEvent(fsEvent, relFile);
    }).on('ready', onReady);
  };
}

function srcWatch(srcDir) {
  return function(onEvent, onReady) {

  };
}

function jsWatch(srcDir) {
  return function(onEvent, onReady) {

  };
}

module.exports = {
  dataWatch,
  pageWatch,
};
