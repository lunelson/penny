//                _       _           _
//               | |     | |         (_)
// __      ____ _| |_ ___| |__ ______ _ ___
// \ \ /\ / / _` | __/ __| '_ \______| / __|
//  \ V  V / (_| | || (__| | | |     | \__ \
//   \_/\_/ \__,_|\__\___|_| |_|     | |___/
//                                  _/ |
//                                 |__/

// built-in
const { join } = require('path');

// npm
const _ = require('lodash');
const chokidar = require('chokidar');

// local
const { pennyLogger } = require('./loggers');
const { bufferCache, JsCompiler } = require('./compile-js.js');
const { Deferral, debounceTime, } = require('./misc-penny.js');

const jsFiles = new Set();

function jsWatch(srcDir, pubDir, options) {

  // create a dummy event callback reference
  let onCompilerEvent;

  // 1. set the jsCompiler;
  // 2. init the jsCompiler with a callback that will run above callback reference
  // 3. create a debounced function for restarting the jsCompiler
  const jsCompiler = JsCompiler(srcDir, pubDir, options);
  jsCompiler.init(jsFiles, srcFile => onCompilerEvent(srcFile));
  const restartJsCompiler = _.debounce(() => jsCompiler.restart(), debounceTime);

  return function(onReady, onEvent) {

    // 1. assign the dummy event callback reference to the real one from serve.js process
    // 2. create a Deferral promise to track readiness of watcher
    onCompilerEvent = onEvent || (() => undefined);
    const watchReady = Deferral();

    // 1. set watcher to find js entry files ONLY
    // 2. set ready listener to resolve watchReady Deferral *and* start the jsCompiler
    const watcher = chokidar.watch(['**/*.js'], {
      ignored: ['**/_*/**/*.*', '**/_*.*', '**/node_modules/**'],
      cwd: pubDir
    }).on('ready', () => { watchReady.resolve(); jsCompiler.start(); });

    watcher.on('all', (fsEvent, relFile) => {

      // bail if event is not 'add' or 'unlink'
      if (!~['add', 'unlink'].indexOf(fsEvent)) return;

      // // check for easy rejections
      // if (anymatch([junk.regex], basename(relFile))) return;

      // resolve abs srcFile
      const srcFile = join(pubDir, relFile);

      // report
      pennyLogger.debug(`${fsEvent} js: ${relFile}`);

      // add or delete js entry file from jsFiles map
      jsFiles[{ add: 'add', unlink: 'delete' }[fsEvent]](relFile);

      // if unlinking, also delete entry from bufferCache
      fsEvent == 'unlink' && delete bufferCache[srcFile];

      // if the jsCompiler is watching, restart it
      if (jsCompiler.watching) restartJsCompiler();
    });

    // make sure onReady gets the watcher, when everything is really ready
    Promise.all([watchReady, jsCompiler.ready]).then(() => onReady(watcher));

    // return the watcher instance
    return watcher;
  };
}

module.exports = { jsFiles, jsWatch };
