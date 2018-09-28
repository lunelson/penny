//                _       _
//               | |     | |
// __      ____ _| |_ ___| |__ ______ ___ _ __ ___
// \ \ /\ / / _` | __/ __| '_ \______/ __| '__/ __|
//  \ V  V / (_| | || (__| | | |     \__ \ | | (__
//   \_/\_/ \__,_|\__\___|_| |_|     |___/_|  \___|

// node
const { extname, join, basename, relative } = require('path');
const { readFileSync } = require('fs');

// npm
const chokidar = require('chokidar');
const anymatch = require('anymatch');
const grayMatter = require('gray-matter');
const junk = require('junk');

// local
const { pennyLogger } = require('./loggers');
const { fileEventNames, allSrcGlob, mdExts } = require('./misc-penny.js');

const srcCompilers = new Map();

function srcWatch(srcDir, pubDir, options) {

  // NB: depReporter eagerly adds files to watch; but
  // they will be checked against srcCompilers before triggering a refresh
  let watcher;
  const depReporter = depFiles => watcher.add(depFiles);

  const compilerInits = [srcDir, pubDir, options, depReporter];
  const MdCompiler = require('./compile-md.js')(...compilerInits);
  const PugCompiler = require('./compile-pug.js')(...compilerInits);
  const ScssCompiler = require('./compile-scss.js')(...compilerInits);

  return function(onReady, onEvent) {

    // set watcher; NB: *not* a const -- refers to let statement above
    // set ready listener
    watcher = chokidar.watch(['**/*'], {
      ignored: ['**/node_modules/**', '_data/**'],
      cwd: srcDir
    }).on('ready', () => onReady(watcher));

    // set main listener
    watcher.on('all', (fsEvent, relFile) => {

      // check for easy rejections
      if (!~fileEventNames.indexOf(fsEvent)) return;
      if (anymatch([junk.regex], basename(relFile))) return;

      // re-resolve srcFile and relFile
      const srcFile = join(srcDir, relFile);
      relFile = relative(pubDir, srcFile); // !! reset wrt pubDir !!

      // check if compilable and not _hidden (i.e. is a valid entry file)
      const isCompilable = anymatch([allSrcGlob], relFile);
      const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relFile);

      // run this block only if this is an entry file
      if (isCompilable && !isHidden) {
        pennyLogger.debug(`${fsEvent} src: ${relFile}`);
        if (fsEvent == 'unlink') { srcCompilers.delete(srcFile); }
        else if (!srcCompilers.has(srcFile)) {
          let srcExt = extname(relFile);

          // set validity flag;
          // invalidate where markdown files have no 'layout' spec'd
          let valid = true;
          if (~mdExts.indexOf(srcExt)) {
            srcExt = '.md';
            const { data } = grayMatter(readFileSync(srcFile, 'utf8'));
            if (!('layout' in data)) valid = false;
          }

          // proceed if still valid
          if (valid) {
            const SrcCompiler = {
              '.md': MdCompiler,
              '.pug': PugCompiler,
              '.scss': ScssCompiler
            }[srcExt];
            srcCompilers.set(srcFile, new SrcCompiler(srcFile)); //
            return;
          }
        }
      }

      // run the callback
      onEvent && onEvent(srcFile);
    });

    return watcher;
  };
}

module.exports = { srcWatch, srcCompilers, };
