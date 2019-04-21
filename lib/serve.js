require('timers');
const fs = require('fs');
const path = require('path');
// const __basename = path.basename(__filename);

const browserSync = require('browser-sync');
const isOnline = require('is-online');

const { $data, watchData } = require('./watch-data');
const { $routes, watchSrc, srcCompilers } = require('./watch-src');
const { pennyLogger } = require('./util-loggers.js');
const { configureBsync } = require('./config-browsersync');

module.exports = async function(options) {
  const { srcDir, pubDir, logLevel, browserSyncOptions, onStart } = options;

  const bsync = browserSync.create();

  const bsyncReloadExts = new Set();
  let bsyncReloadTimer = null;
  function bsyncReload(...exts) {
    bsyncReloadTimer && clearTimeout(bsyncReloadTimer);
    exts.forEach(ext => bsyncReloadExts.add(ext));
    bsyncReloadTimer = setTimeout(() => {
      bsync.reload([...bsyncReloadExts].map(ext => `*${ext}`));
      bsyncReloadExts.clear();
      bsyncReloadTimer = null;
    }, 100);
  }

  const parsingErrors = new Map();
  const compilingErrors = new Map();

  let osdUpdateTimer = null;
  function osdUpdate(emitter = bsync.sockets) {
    osdUpdateTimer && clearTimeout(osdUpdateTimer);
    osdUpdateTimer = setTimeout(() => {
      const errors = [...parsingErrors.entries(), ...compilingErrors.entries()];
      if (errors.length) {
        emitter.emit('osd:show', errors);
      } else {
        emitter.emit('osd:hide');
      }
      osdUpdateTimer = null;
    }, 100);
  }

  options.onParse = function onParse(err, absFile) {
    if (err) {
      parsingErrors.set(absFile, err);
    } else if (parsingErrors.has(absFile)) {
      parsingErrors.delete(absFile);
    }
    osdUpdate();
  };

  options.onCompile = function onCompile(err, absFile) {
    if (err) {
      compilingErrors.set(absFile, err);
    } else if (compilingErrors.has(absFile)) {
      compilingErrors.delete(absFile);
    }
    osdUpdate();
  };

  const dataWatcher = await watchData(options, (err, absFile) => {
    // srcCompilers.filter(isHTML).forEach =>
    // delete compiler.outCache
    // ? only refresh if there are no errors?
    // bSyncRefresh('.html')
  });

  pennyLogger.info('data watcher is ready');

  const srcWatcher = await watchSrc(options, (err, absFile) => {
    // srcCompilers.forEach
    // if compiler depends on srcFile -> delete compiler template; add compiler outExt to refresh
    // else if compiler is HTML and srcFile is HTML -> delete compiler cache; add html to refresh
    // bsyncRefresh(refreshExts)
  });

  pennyLogger.info('route watcher is ready');

  bsync.init(
    configureBsync(options, (req, res, next) => {
      // middlware
      next();
    }),
    (err, instance) => {
      // osdUpdate = function(emitter = bsync.sockets) {
      //   if (osdErrors.size) {
      //     emitter.emit('osd:show', [...osdErrors.entries()][0]);
      //   } else {
      //     emitter.emit('osd:hide');
      //   }
      // };

      bsync.sockets.on('connection', osdUpdate);

      console.log('bsync setup is done');
    },
  );

  // setTimeout(function() {
  //   bsync.sockets.emit('osd:show', {
  //     title: 'Hello from Example',
  //     body: '5 seconds have elapsed!',
  //   });
  // }, 5000);

  pennyLogger.info(`serving from {magenta:@/${path.relative(process.cwd(), pubDir)}}`);
};

/**
 *
 * ERROR HANDLING
 *
 * - create an emitter, which can be passed to watchers & compilers
 * - have the emitter call bsync.socket.emit() with specific options per err type
 * -
 */
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

/*
    TODO
    - have watchData attach $data to the options object
    - have watchSrc attach $pages to the options object
    - have watchSrc pick up the onStart handler and run it there, feeding $data and $pages
  */

// const dataWatchInit = watchData();
// const srcWatchInit = watchSrc();
// const jsWatchInit = watchJs();
// const onlineCheck = isOnline();

// const [
//   dataWatcher,
//   srcWatcher,
//   jsWatcher,
//   onlineStatus
// ] = await Promise.all([
//   dataWatchInit,
//   srcWatchInit,
//   jsWatchInit,
//   onlineCheck
// ]);
