require('timers');
const path = require('path');

const browserSync = require('browser-sync');
const isOnline = require('is-online');

const { watchJs } = require('./watch-js');
const { $data, watchData } = require('./watch-data');
const { $routes, watchSrc, srcCompilerMap } = require('./watch-src');
const { pennyLogger } = require('./util-loggers.js');
const { srcOutExts, shutdown } = require('./util-general.js');
const { configBS: configureBS } = require('./config-browser-sync');

module.exports = async function(options) {
  const { srcDir, pubDir, logLevel, browserSyncOptions, onStart } = options;
  let allReady = false;

  /**
   * WATCH / COMPILE ERROR handlers
   * define Maps to store watcher and compiler errors
   * define handlers for watch (parse) and compile file-events
   */
  const watchingErrors = new Map();
  const compilingErrors = new Map();

  Object.assign(options, {
    onWatch(err, absFile) {
      if (err) {
        watchingErrors.set(absFile, err);
      } else if (watchingErrors.has(absFile)) {
        watchingErrors.delete(absFile);
      }
      // osdUpdate();
    },
    onCompile(err, absFile) {
      if (err) {
        compilingErrors.set(absFile, err);
      } else if (compilingErrors.has(absFile)) {
        compilingErrors.delete(absFile);
      }
      // osdUpdate();
    },
  });

  /**
   * OSD UPDATE handler
   * (client-side functionality defined in ./config-bs-client.js)
   * debounced to 100ms intervals
   */
  let osdUpdateTimeout = null;
  function osdUpdate(socket = bs.sockets) {
    osdUpdateTimeout && clearTimeout(osdUpdateTimeout);
    osdUpdateTimeout = setTimeout(() => {
      const errors = [...watchingErrors.values(), ...compilingErrors.values()];
      if (errors.length) {
        socket.emit('penny:osd:show', errors);
      } else {
        socket.emit('penny:osd:hide');
      }
      osdUpdateTimeout = null;
    }, 100);
  }

  /**
   * BS RELOAD handler
   * (bs expects an array of extension strings)
   * this pattern allows:
   *  de-duplicating extensions, which are collected on each fn-call, while
   *  de-bouncing of the actual reloading, to 100ms intervals
   */
  const bs = browserSync.create();
  const bsReloadExts = new Set();
  let bsReloadTimeout = null;
  function bsReload(...exts) {
    if (!allReady) return;
    if (watchingErrors.size || compilingErrors.size) return osdUpdate();
    bsReloadTimeout && clearTimeout(bsReloadTimeout);
    exts.forEach(ext => bsReloadExts.add(ext));
    bsReloadTimeout = setTimeout(() => {
      bs.reload([...bsReloadExts].map(ext => `*${ext}`));
      bsReloadExts.clear(); // reset
      bsReloadTimeout = null; // reset
    }, 100);
  }

  /**
   * DATA WATCHER startup
   * srcCompilers.forEach
   *   if compiler src is template and output is HTML
   *     delete compiler outcache
   *     bsReload('.html')
   */
  pennyLogger.info('starting data watcher...');
  const dataWatchInit = watchData(options, (err, absFile) => {
    if (err) return; // these errors are handled in watchingErrors
    [...srcCompilerMap.values()].forEach(compiler => {
      if (compiler.outExt == '.html' && compiler.srcExt != '.html') {
        delete compiler.outcache;
        bsReload('.html');
      }
    });
    if (srcCompilerMap.size > 0) {
    }
  });

  /**
   * HTML/CSS SRC WATCHER startup
   * srcCompilers.forEach
   *   check, if true push ext in exts
   *   if exts, fire bsReload(...exts)
   */
  pennyLogger.info('starting html/css src watcher...');
  const srcWatchInit = watchSrc(options, (err, srcFile) => {
    if (err) return; // these errors are handled in watchingErrors
    const outExts = [];
    [...srcCompilerMap.values()].forEach(compiler => {
      if (compiler.check(srcFile)) {
        const srcExt = path.extname(compiler.srcFile);
        outExts.push(srcOutExts[srcExt] || srcExt);
      }
    });
    if (outExts.length > 0) {
      pennyLogger.debug(`refreshing ${outExts} from srcWatching`);
      bsReload(...outExts);
    }
    if (srcCompilerMap.size > 0) {
    }
  });

  /**
   * JS (WEBPACK) WATCHER startup
   *
   */
  pennyLogger.info('starting js (webpack) watcher(s)...');
  const jsWatchInit = Promise.resolve();
  // const jsStartup = watchJs(options, (err, srcFile) => {
  //   pennyLogger.debug('refreshing .js from jsWatching');
  //   bsReload('.js');
  // });

  // NB: must be sure that all of these resolve!!
  const [online] = await Promise.all([isOnline(), jsWatchInit, dataWatchInit, srcWatchInit]).catch(
    shutdown,
  );

  /**
   * BROWSER-SYNC init
   *
   */
  pennyLogger.info('starting browser-sync server...');
  bs.init(configureBS(options, { online }), (err, instance) => {
    if (err) return shutdown(err);
    allReady = true;
    bs.sockets.on('connection', osdUpdate);
  });
};

/**
 *
 * ERROR HANDLING
 *
 * - create an emitter, which can be passed to watchers & compilers
 * - have the emitter call bs.socket.emit() with specific options per err type
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
