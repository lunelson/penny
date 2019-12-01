/**
 *
 *
 *  ___  ___ _ ____   _____
 * / __|/ _ \ '__\ \ / / _ \
 * \__ \  __/ |   \ V /  __/
 * |___/\___|_|    \_/ \___|
 *
 *
 */

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
}, {});

let bsync;
let ready = false;
const errMap = new Map();

// OSD UPDATER (this could be normal _.debounce())
let updateTimeout = null;
function osdUpdate(socket = bsync.sockets) {
  updateTimeout && clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    if (errMap.size) {
      socket.emit('penny:osd:show', errMap);
    } else {
      socket.emit('penny:osd:hide');
    }
    updateTimeout = null;
  }, 100);
}

// BS RELOADER -- special debounce, de-dedupes reload extensions
let reloadTimeout = null;
const reloadExtSet = new Set();
function bsReload(...exts) {
  if (!ready) return;
  reloadTimeout && clearTimeout(reloadTimeout);
  exts.forEach(ext => reloadExtSet.add(ext));
  reloadTimeout = setTimeout(() => {
    // TODO: does osdUpdate need to be fired here?
    // osdUpdate(); // socket -> penny:osd:*
    pennyLogger.debug(`reloading/injecting for ${[...reloadExtSet]}`);
    bsync.reload([...reloadExtSet].map(ext => `*${ext}`)); // socket -> reload/inject
    reloadExtSet.clear(); // reset
    reloadTimeout = null; // reset
  }, 100);
}

module.exports = async function(options) {
  // create browsersync
  bsync = browserSync.create();

  // DATA WATCHER
  pennyLogger.info('starting data watcher...');

  const dataWatchInit = watchData(options, (err, watchFile) => {
    // update errors; return early if any remain
    errMap[err ? 'set' : 'delete'](watchFile, err);
    if (errMap.size) return osdUpdate();

    // clear or reset compiler(s)
    [...srcCompilerMap.values()].forEach(compiler => {
      if (compiler.outExt == '.html') compiler.clear();
      // ?? do we need to reset non-html compilers ??
    });

    bsReload('.html');
  });

  // HTML/CSS SRC WATCHER
  pennyLogger.info('starting html/css src watcher...');

  const srcWatchInit = watchSrc(options, (err, watchFile) => {
    // update errors; return early if any remain
    errMap[err ? 'set' : 'delete'](watchFile, err);
    if (errMap.size) return osdUpdate();

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
    // update errors; return early if any remain
    errMap[err ? 'set' : 'delete'](watchFile, err);
    if (errMap.size) return osdUpdate();

    bsReload('.js');
  });

  // NB: must be sure that all of these resolve!!
  const [online] = await Promise.all([isOnline(), jsWatchInit, dataWatchInit, srcWatchInit])
    // .then(() => console.log('all of the watcher inits have completed'))
    .catch(shutdown);

  console.log('if we got to this point, all of the watchers have started');

  // BROWSER-SYNC init
  pennyLogger.info('starting browser-sync server...');

  bsync.init(configureBS(options, { online }), (err, instance) => {
    if (err) return shutdown(err);
    ready = true;
    bsync.sockets.on('connection', socket => {
      osdUpdate();

      /**
       * OSD TESTING ONLY
       */
      setTimeout(() => {
        socket.emit('penny:osd:show', {
          title: 'this is the title',
          body: 'this is the message',
        });
      }, 3000);
      setTimeout(() => {
        socket.emit('penny:osd:hide');
      }, 5000);
    });
  });
};
