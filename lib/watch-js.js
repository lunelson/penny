const jsFiles = new Set();

function jsWatch(srcDir, pubDir, options) {
  const jsCompiler = require('./compile-js.js')(srcDir, pubDir, options);
  jsCompiler.init(jsFiles);
  const restartJsCompiler = _.debounce(() => jsCompiler.restart(), debounceTime);
  return function(onReady, onEvent) {
    /*
      NB:
      this is only watching for 'add' and 'unlink' events
      changes are tracked by webpack compiler
    */
    const watchReady = Deferral();
    bsync.watch(['**/*.js'], {
      ignored: ['**/_*/**/*.*', '**/_*.*', '**/node_modules/**'],
      cwd: pubDir // only interested in compilable js files (see above)
    }, (fsEvent, relFile) => {
      // check for easy rejections
      if (!~fileEventNames.indexOf(fsEvent)) return;
      if (anymatch([junk.regex], basename(relFile))) return;
      // resolve abs srcFile
      const srcFile = join(pubDir, relFile);
      // proceed ->
      pennyLogger.debug(`${fsEvent} js: ${relFile}`);
      if (fsEvent == 'add' || fsEvent == 'unlink') {
        jsFiles[{ add: 'add', unlink: 'delete' }[fsEvent]](relFile);
        fsEvent == 'unlink' && delete bufferCache[srcFile];
        if (jsCompiler.watching) restartJsCompiler();
      }
      onEvent && onEvent(srcFile);
    }).on('ready', () => { watchReady.resolve(); jsCompiler.start(); });
    Promise.all([watchReady, jsCompiler.ready]).then(onReady);
  };
}
