const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');

const _ = require('lodash');
const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const grayMatter = require('gray-matter');
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

function dataWatch(baseDir) {
  const dataTreeSync = $dataSyncer(baseDir);
  console.dir({dataGlob});
  return function(onReady, onEvent) {
    return bsync.watch([dataGlob], {
      cwd: baseDir
    }, (fsEvent, relFile) => {
      pennyLogger.debug(`${fsEvent} $data: ${relFile}`);
      dataTreeSync(fsEvent, relFile);
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
      pennyLogger.debug(`${fsEvent} $page: ${relFile}`);
      pagesMapSync(fsEvent, relFile);
      onEvent && onEvent(fsEvent, relFile);
    }).on('ready', onReady);
  };
}

const srcCompilers = new Map();

function srcWatch(srcDir, options) {

  const MdCompiler = require('./compile-md.js')(srcDir, options);
  const PugCompiler = require('./compile-pug.js')(srcDir, options);
  const ScssCompiler = require('./compile-scss.js')(srcDir, options);

  return function(onReady, onEvent) {
    return bsync.watch(['**/*'], {
      ignored: ['**/node_modules/**', '_data/**'],
      cwd: srcDir
    }, (fsEvent, relFile) => {
      if (anymatch([junk.regex], basename(relFile))) return;
      if (!~fileEventNames.indexOf(fsEvent)) return;
      const isCompilable = anymatch([allSrcGlob], relFile);
      const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relFile);
      const srcFile = join(srcDir, relFile);
      if (isCompilable && !isHidden) {
        pennyLogger.debug(`${fsEvent} src: ${relFile}`);
        if (fsEvent == 'unlink') { srcCompilers.delete(srcFile); }
        else if (!srcCompilers.has(srcFile)) {
          let valid = true;
          let srcExt = extname(relFile);
          if (~mdExts.indexOf(srcExt)) {
            srcExt = '.md';
            const { data } = grayMatter(readFileSync(srcFile, 'utf8'));
            if (!('layout' in data)) valid = false;
          }
          if (valid) {
            const SrcCompiler = {
              '.md': MdCompiler,
              '.pug': PugCompiler,
              '.scss': ScssCompiler
            }[srcExt];
            srcCompilers.set(srcFile, new SrcCompiler(srcFile));
            return;
          }
        }
      }
      onEvent && onEvent(srcFile);
    }).on('ready', onReady);
  };
}

const jsFiles = new Set();

function jsWatch(srcDir, options) {
  const jsCompiler = require('./compile-js.js')(srcDir, null, options);
  jsCompiler.init(jsFiles);
  const restartJsCompiler = _.debounce(() => jsCompiler.restart(), debounceTime);
  return function(onReady, onEvent) {
    const watchReady = Deferral();
    bsync.watch(['**/*.js'], {
      ignored: ['**/_*/**/*.*', '**/_*.*', '**/node_modules/**'],
      cwd: srcDir
    }, (fsEvent, relFile) => {
      if (anymatch([junk.regex], basename(relFile))) return;
      if (!~fileEventNames.indexOf(fsEvent)) return;
      pennyLogger.debug(`${fsEvent} js: ${relFile}`);
      const srcFile = join(srcDir, relFile);
      if (fsEvent == 'add' || fsEvent == 'unlink') {
        jsFiles[{ add: 'add', unlink: 'delete' }[fsEvent]](relFile);
        fsEvent == 'unlink' && delete bundleCache[srcFile];
        if (jsCompiler.watching) restartJsCompiler();
      }
      onEvent && onEvent(srcFile);
    }).on('ready', () => { watchReady.resolve(); jsCompiler.start(); });
    Promise.all([watchReady, jsCompiler.ready]).then(onReady);
  };
}

module.exports = {
  dataWatch,
  pageWatch,
  srcWatch,
  jsWatch,
  srcCompilers,
};
