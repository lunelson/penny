// built-in

const { relative, extname, join, resolve, dirname, basename } = require('path');
const { statSync, readFileSync, createWriteStream } = require('fs');

// npm

const _ = require('lodash');
const rrdir = require('recursive-readdir');
const mm = require('micromatch'); // https://github.com/micromatch/micromatch
const cp = require('cp-file');
const del = require('del');
const junk = require('junk');
const write = require('write');
const toStream = require('to-readable-stream');

const { pennyLogger } = require('./loggers.js');

// local

const {
  bundleCache, // cachedBuffers
  memoryFs,
} = require('./caches.js');

const {
  dataWatch,
  pageWatch,
  srcWatch,
  jsWatch,
  srcCompilers,
} = require('./watch.js');

const {
  // utils
  replaceExt,
  // file extname stuff
  outExtContentTypes,
  outSrcExts,
  srcOutExts,
  srcExts,
  dataExts,
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

const compilerExts = ['.js'].concat(..._.values(outSrcExts));

module.exports = function (srcDir, pubDir, outDir, options) {

  /*
    STEPS
    - start up data and page watchers -> syncing
    - start up src and js watchers -> compilers
    - identify outFiles vs srcFiles
    - perform on a temp directory:
      - copy all the outFiles
      - for each srcFile
        - trigger its compiler
        - stream the result from memory to a writeStream in temp
    - if everything worked
      - delete everything in dest, except keep_files paths
      - move temp files in to place
  */

  // get options; set/exec stuff if needed
  const { logLevel, useHTTPS } = options;

  const dataWatcher = dataWatch(srcDir);
  const dataWatching = new Promise((resolve, reject) => {
    try { dataWatcher(resolve); }
    catch(err) { reject(err); }
  });

  const pageWatcher = pageWatch(pubDir);
  const pageWatching = new Promise((resolve, reject) => {
    try { pageWatcher(resolve); }
    catch(err) { reject(err); }
  });

  const srcWatcher = srcWatch(srcDir, pubDir, options);
  const srcWatching = Promise.all([ dataWatching, pageWatching ])
    .then(() => new Promise((resolve, reject) => {
      try { srcWatcher(resolve); }
      catch (err) { reject(err); }
    }));

  const jsWatcher = jsWatch(srcDir, pubDir, options);
  const jsWatching = new Promise((resolve, reject) => {
    try { jsWatcher(resolve); }
    catch(err) { reject(err); }
  });

  Promise.all([ dataWatching, pageWatching, srcWatching, jsWatching ])
    .then(() => rrdir(srcDir).then(files => {

      const relFiles = files.map(file => relative(pubDir, file));

      // sort the files by type

      const relFileTypes = mm(relFiles, ['**/*','!**/_*/**/*.*', '!**/_*.*', '!**/node_modules/**'])
        .filter(file => junk.not(basename(file)))
        .reduce((obj, file) => {
          const ext = extname(file);
          const type = ~srcExts.indexOf(ext) ?
            'src' :
            ext == '.js' ?
              'js' :
              'other';
          obj[type] = obj[type] || [];
          obj[type].push(file);
          return obj;
        }, {});

      // clear the destination directory, except for keepFiles

      del.sync([join(outDir, '**'), `!${outDir}`].concat(options.keepFiles.map(fp => `!${fp}`)));

      // copy all other files

      relFileTypes.other.forEach(relFile => cp.sync(join(pubDir, relFile), join(outDir, relFile)));

      // output all src files

      relFileTypes.src.forEach(relFile => {
        const srcFile = join(pubDir, relFile);
        const srcExt = extname(srcFile);
        const outExt = srcOutExts[srcExt];
        const outFile = replaceExt(join(outDir, relFile), outExt);
        const compiler = srcCompilers.get(srcFile);
        compiler && compiler.stream().pipe(write.stream(outFile));
      });

      // output all js files

      relFileTypes.js.forEach(relFile => {
        const srcFile = join(pubDir, relFile);
        const srcExt = extname(srcFile);
        const outExt = srcOutExts[srcExt];
        const outFile = replaceExt(join(outDir, relFile), outExt);
        if (srcFile in bundleCache) {
          return bundleCache[srcFile].then(buffer => toStream(buffer).pipe(write.stream(outFile)));
        } else {
          let memFile = false;
          try { memFile = memoryFs.statSync(srcFile).isFile(); }
          catch(err) { return; }
          if (memFile) return memoryFs.createReadStream(srcFile).pipe(write.stream(outFile));
        }
      });

    }))
    .catch(err => pennyLogger.error(err.toString())); // catchAll catch!!
};
