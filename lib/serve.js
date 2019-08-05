require('timers');
const path = require('path');

const _ = require('lodash');
const browserSync = require('browser-sync');
const isOnline = require('is-online');

const { watchJs } = require('./watch-js');
const { $data, watchData } = require('./watch-data');
const { $routes, watchSrc, srcCompilerMap } = require('./watch-src');
const { pennyLogger } = require('./util-loggers.js');
const { shutdown } = require('./util-general.js');
const { configBS: configureBS } = require('./config-browser-sync');

const mdExts = ['.md', '.mdown', '.markdown'];

const outSrcExts = {
  '.html': ['.pug', '.njk', '.ejs', ...mdExts],
  '.css': ['.scss', '.sass', '.styl'],
  '.js': [], // eventualy .ts, .es ?
};

const srcOutExts = Object.keys(outSrcExts).reduce((obj, key, i) => {
  obj[key] = key;
  outSrcExts[key].forEach(ext => (obj[ext] = key));
  return obj;
}, {}); //?

module.exports = async function(options) {
  let allReady = false;
  const errors = new Map();
  const bs = browserSync.create();

  // OSD UPDATER (this could be normal _.debounce())
  let updateTimeout = null;
  function osdUpdate(socket = bs.sockets) {
    updateTimeout && clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      if (errors.size) {
        socket.emit('penny:osd:show', errors);
      } else {
        socket.emit('penny:osd:hide');
      }
      updateTimeout = null;
    }, 100);
  }

  // BS RELOADER -- special debounce, de-dedupes reload extensions
  let reloadTimeout = null;
  const reloadExts = new Set();
  function bsReload(...exts) {
    if (!allReady) return;
    reloadTimeout && clearTimeout(reloadTimeout);
    exts.forEach(ext => reloadExts.add(ext));
    reloadTimeout = setTimeout(() => {
      osdUpdate(); // socket -> penny:osd:*
      pennyLogger.debug(`refreshing ${reloadExts}`);
      bs.reload([...reloadExts].map(ext => `*${ext}`)); // socket -> reload/inject
      reloadExts.clear(); // reset
      reloadTimeout = null; // reset
    }, 100);
  }

  // DATA WATCHER
  pennyLogger.info('starting data watcher...');

  const dataWatchInit = watchData(options, (err, watchFile) => {
    // set / delete errors
    if (err) errors.set(watchFile, err);
    else errors.delete(watchFile);
    if (errors.size) return osdUpdate();

    // clear or reset compiler(s)
    [...srcCompilerMap.values()].forEach(compiler => {
      if (compiler.outExt == '.html') compiler.clear();
    });

    // reload for html outputs
    return bsReload('.html');
  });

  // HTML/CSS SRC WATCHER
  pennyLogger.info('starting html/css src watcher...');

  const srcWatchInit = watchSrc(options, (err, watchFile) => {
    // set / delete errors
    if (err) errors.set(watchFile, err);
    else errors.delete(watchFile);
    if (errors.size) return osdUpdate();

    // clear or reset compiler(s)
    const outExts = [],
      watchFileExt = path.extname(watchFile);
    [...srcCompilerMap.values()].forEach(compiler => {
      if (compiler.check(watchFile)) {
        outExts.push(compiler.outExt);
        compiler.reset();
      } else if (compiler.outExt == '.html' && watchFileExt == '.html') {
        outExts.push(compiler.outExt);
        compiler.clear();
      } else {
        outExts.push(watchFileExt);
      }
    });

    // reload for concerned output types
    if (outExts.length > 0) bsReload(...outExts);
  });

  // JS (WEBPACK) WATCHER
  pennyLogger.info('starting js (webpack) watcher(s)...');

  const jsWatchInit = watchJs(options, (err, watchFile) => {
    // set / delete errors
    if (err) errors.set(watchFile, err);
    else errors.delete(watchFile);
    if (errors.size) return osdUpdate();
    pennyLogger.debug('refreshing .js from jsWatching');
    bsReload('.js');
  });

  // NB: must be sure that all of these resolve!!
  const [online] = await Promise.all([isOnline(), jsWatchInit, dataWatchInit, srcWatchInit]).catch(
    shutdown,
  );

  // BROWSER-SYNC init
  pennyLogger.info('starting browser-sync server...');

  bs.init(configureBS(options, { online }), (err, instance) => {
    if (err) return shutdown(err);
    allReady = true;
    bs.sockets.on('connection', osdUpdate);
  });
};
