require('timers');
const fs = require('fs');
const path = require('path');
// const __basename = path.basename(__filename);

const browserSync = require('browser-sync');
const isOnline = require('is-online');

const { $data, watchData, $routes, watchRoutes } = require('./watch-data');
const { pennyLogger } = require('./util-loggers.js');
const { configureBsync } = require('./config-browsersync');

module.exports = async function(options) {
  const { srcDir, pubDir, logLevel, browserSyncOptions, onStart } = options;

  let bsyncReady = false;
  const bsync = browserSync.create();

  const bsyncReloadExts = new Set();
  let bsyncReloadTimer;
  function bsyncReload(...exts) {
    exts.forEach(ext => bsyncReloadExts.add(ext));
    clearTimeout(bsyncReloadTimer);
    bsyncReloadTimer = setTimeout(() => {
      bsync.reload([...bsyncReloadExts].map(ext => `*${ext}`));
      bsyncReloadExts.clear();
      bsyncReloadTimer = null;
    }, 100);
  }

  const osdErrors = new Map();
  let updateOSD = function() {};

  // returns chokidar watcher instance
  /**
   * MUST
   * attach $data to options object
   *
   */
  const dataWatcher = await watchData(options, (err, data) => {
    const { srcFile } = data;
    if (err) {
      osdErrors.set(srcFile, { ns: 'watch:data', err });
    } else if (osdErrors.has(srcFile)) {
      osdErrors.delete(srcFile);
    }
    updateOSD();
    // srcCompilers.filter(isHTML).forEach =>
    // delete compiler.outCache
    // ? only refresh if there are no errors?
    // bSyncRefresh('.html')
  });

  pennyLogger.info('data watcher is ready');

  // returns chokidar watcher instance
  const routeWatcher = await watchRoutes(options, (err, data) => {
    const { srcFile, srcCompilers } = data;
    if (err) {
      osdErrors.set(srcFile, { ns: 'watch:src', err });
    } else if (osdErrors.has(srcFile)) {
      osdErrors.delete(srcFile);
    }
    updateOSD();
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
      updateOSD = function(emitter = bsync.sockets) {
        if (osdErrors.size) {
          emitter.emit('osd:show', [...osdErrors.entries()][0]);
        } else {
          emitter.emit('osd:hide');
        }
      };

      bsync.sockets.on('connection', updateOSD);

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
