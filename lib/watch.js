const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');

const _ = require('lodash');
const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const grayMatter = require('gray-matter');
const junk = require('junk');

const { pennyLogger } = require('./loggers.js');

const { bufferCache, JsCompiler } = require('./compile-js.js');

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
  mdExts,
  // file globs
  dataGlob,
  allSrcGlob,
  cssSrcGlob,
  htmlSrcGlob,
  // bsync/connect stuff
  debounceTime,
  fileEventNames,
  bsync,
  inject,
  serveFavicon,
  serveStaticOptions,
} = require('./misc-penny.js');

// const srcCompilers = new Map();

// function srcWatch(srcDir, pubDir, options) {

//   let watcher;
//   // depReporter eagerly adds files to watch; but
//   // they will be checked against srcCompilers before triggering a refresh
//   const depReporter = depFiles => watcher.add(depFiles);
//   const compilerInits = [srcDir, pubDir, options, depReporter];
//   const MdCompiler = require('./compile-md.js')(...compilerInits);
//   const PugCompiler = require('./compile-pug.js')(...compilerInits);
//   const ScssCompiler = require('./compile-scss.js')(...compilerInits);

//   return function(onReady, onEvent) {
//     watcher = bsync.watch(['**/*'], {
//       ignored: ['**/node_modules/**', '_data/**'],
//       cwd: srcDir
//     }, (fsEvent, relFile) => {

//       // check for easy rejections
//       if (!~fileEventNames.indexOf(fsEvent)) return;
//       if (anymatch([junk.regex], basename(relFile))) return;

//       // re-resolve srcFile and relFile
//       const srcFile = join(srcDir, relFile);
//       relFile = relative(pubDir, srcFile); // !! reset wrt pubDir !!

//       // proceed ->
//       const isCompilable = anymatch([allSrcGlob], relFile);
//       const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relFile);
//       if (isCompilable && !isHidden) {
//         pennyLogger.debug(`${fsEvent} src: ${relFile}`);
//         if (fsEvent == 'unlink') { srcCompilers.delete(srcFile); }
//         else if (!srcCompilers.has(srcFile)) {
//           let valid = true;
//           let srcExt = extname(relFile);
//           if (~mdExts.indexOf(srcExt)) {
//             srcExt = '.md';
//             const { data } = grayMatter(readFileSync(srcFile, 'utf8'));
//             if (!('layout' in data)) valid = false;
//           }
//           if (valid) {
//             const SrcCompiler = {
//               '.md': MdCompiler,
//               '.pug': PugCompiler,
//               '.scss': ScssCompiler
//             }[srcExt];
//             srcCompilers.set(srcFile, new SrcCompiler(srcFile)); //
//             return;
//           }
//         }
//       }

//       // run the callback
//       onEvent && onEvent(srcFile);
//     }).on('ready', () => onReady(watcher));
//     return watcher;
//   };
// }

const jsFiles = new Set();

function jsWatch(srcDir, pubDir, options) {
  let onCompilerEvent;
  const jsCompiler = JsCompiler(srcDir, pubDir, options);
  jsCompiler.init(jsFiles, srcFile => onCompilerEvent(srcFile));
  const restartJsCompiler = _.debounce(() => jsCompiler.restart(), debounceTime);
  return function(onReady, onEvent) {
    /*
      NB:
      this is only watching for 'add' and 'unlink' events
      only entry files are tracked here
      dependencies are tracked by webpack compiler
    */
    onCompilerEvent = onEvent || (() => undefined);
    const watchReady = Deferral();
    const watcher = bsync.watch(['**/*.js'], {
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
      // onEvent && onEvent(srcFile);
    }).on('ready', () => { watchReady.resolve(); jsCompiler.start(); });
    return Promise.all([watchReady, jsCompiler.ready]).then(() => onReady(watcher));
  };
}

module.exports = {
  // srcWatch,
  jsWatch,
  // srcCompilers,
};
