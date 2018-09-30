// built-in

const { relative, extname, join } = require('path');

// npm

const _ = require('lodash');
const parseUrl = require('parseurl');
const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const toStream = require('to-readable-stream');

// local

const { pennyLogger } = require('./loggers.js');
const { bufferCache, memoryFs, } = require('./compile-js.js');
const { dataWatch, pageWatch, } = require('./watch-meta.js');
const { srcWatch, srcCompilers, } = require('./watch-src.js');
const { jsWatch, } = require('./watch.js');

const {
  // utils
  replaceExt,
  // file extname stuff
  outExtContentTypes,
  outSrcExts,
  srcOutExts,
  // bsync/connect stuff
  debounceTime,
  bsync,
  serveFavicon,
  serveStaticOptions,
} = require('./misc-penny.js');

let allReady = false;
let jsCompilerReady = false;
let srcCompilersReady = false;

module.exports = function(srcDir, pubDir, options) {

  // get options; set/exec stuff if needed
  const { logLevel } = options;

  const bsyncRefresh = _.debounce(outExts => {
    if (!allReady) return;
    bsync.reload(outExts.map(ext => `*${ext}`));
  }, debounceTime);

  // DATA & PAGE WATCHING

  function metaRefresh() {
    if (!allReady) return;
    srcCompilers.forEach(compiler => {
      if (!~outSrcExts['.html'].indexOf(extname(compiler.srcFile))) return;
      pennyLogger.debug(`deleting outCache for ${relative(pubDir, compiler.srcFile)}`);
      delete compiler.outCache;
    });
    bsyncRefresh(['.html']);
  }

  const dataWatcher = dataWatch(srcDir);
  const dataWatching = new Promise((resolve, reject) => {
    try { dataWatcher(resolve, metaRefresh); }
    catch(err) { reject(err); }
  });

  const pageWatcher = pageWatch(pubDir);
  const pageWatching = new Promise((resolve, reject) => {
    try { pageWatcher(resolve, metaRefresh); }
    catch(err) { reject(err); }
  });

  // SRC WATCHING

  const srcWatcher = srcWatch(srcDir, pubDir, options);
  const srcWatching = Promise.all([ dataWatching, pageWatching ])
    .then(() => new Promise((resolve, reject) => {
      try {
        srcWatcher(resolve, (srcFile) => {
          const outExtSet = new Set();
          if (srcCompilersReady) {
            srcCompilers.forEach(compiler => {
              if (compiler.check(srcFile)) {
                const srcExt = extname(compiler.srcFile);
                const outExt = srcOutExts[srcExt] || srcExt;
                outExtSet.add(outExt);
              }
            });
          }
          if (outExtSet.size > 0) {
            pennyLogger.debug(`refreshing ${[...outExtSet]} from srcWatching`);
            bsyncRefresh([...outExtSet]);
          }
        });
      }
      catch (err) { reject(err); }
    }).then(() => { srcCompilersReady = true; }));

  // JS WATCHING (entry points only)

  const jsWatcher = jsWatch(srcDir, pubDir, options);
  const jsWatching = new Promise((resolve, reject) => {
    try { jsWatcher(resolve, (srcFile) => {
      if (jsCompilerReady) {
        pennyLogger.debug('refreshing .js from jsWatching');
        bsyncRefresh(['.js']);
      }
    });
    } catch(err) { reject(err); }
  }).then(() => { jsCompilerReady = true; });

  // BSYNC INIT

  const bsyncRunning = new Promise((resolve, reject) => {
    bsync.init({
      files: false,
      open: false,
      logLevel,
      notify: logLevel == 'debug',
      logPrefix: 'BS', // change back to penny ?
      server: { baseDir: pubDir, serveStaticOptions },
      middleware: [ serveFavicon, srcController ],
      // NB re HTTP/2:
      // bsync does not yet support the native module; see
      // the supported one is node-http2, here:
      // the mechanics of node module name conflicts (see https://github.com/nodejs/http2/issues/29#issuecomment-268125271)
      // ...require the following form of requiring
      httpModule: require('../node_modules/http2'),
      https: true,
    }, resolve);
  });

  // faviconWare, compilerWare, memoryFsWare

  Promise.all([dataWatching,pageWatching,jsWatching,srcWatching,bsyncRunning])
    .then(() => { allReady = true; })
    .catch(err => pennyLogger.error(err.toString())); // catchAll catch!!

  function setHeaders(res, ext) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', outExtContentTypes[ext]);
  }

  function srcController(req, res, next) {

    let { pathname:reqFile } = parseUrl(req), outExt = extname(reqFile);

    // bail if file path contains leading underscore (hidden files)
    if (anymatch(['**/_*/**/*.*', '**/_*.*'], reqFile)) {
      res.writeHead(403, 'Forbidden');
      res.end('This request path contains an underscore-prefixed folder or file. These are not served or built by Penny.');
      return false;
    }

    // fallback to .html extname if reqFile has none, and to /index.html if reqFile has trailing slash
    if (!outExt) { outExt = '.html'; reqFile = reqFile.replace(/\/$/, '/index') + outExt; }

    // bail if extname is not .html, .css or .js
    if (!~['.html', '.css', '.js'].indexOf(outExt)) return next();

    // calc absolute path of output file
    const outFile = join(pubDir, reqFile);

    // try serving it from memoryFs (usually only for JS)
    let memFile = false;
    try { memFile = memoryFs.statSync(outFile).isFile(); }
    catch(err) { /* pennyLogger.debug(`File not in memoryFs: {magenta:${reqFile}}`); */ }
    if (memFile) {
      setHeaders(res, outExt); // set headers
      pennyLogger.debug(`Served from memoryFs: {magenta:${reqFile}}`);
      return memoryFs.createReadStream(outFile).pipe(res);
    }

    // if it's in bufferCache, serve it (usually only for JS)
    else if (outFile in bufferCache) {
      setHeaders(res, outExt); // set headers
      pennyLogger.debug(`Served from bufferCache: {magenta:${reqFile}}`);
      return bufferCache[outFile].then(buffer => toStream(buffer).pipe(res));
    }

    // otherwise see if any compilers have it
    else {
      const srcFile = outSrcExts[outExt]
        .map(srcExt => replaceExt(outFile, srcExt))
        .find(srcFile => srcCompilers.has(srcFile));

      if (srcFile) {
        setHeaders(res, outExt); // set headers
        pennyLogger.debug(`Served via compiler: {magenta:${relative(pubDir, srcFile)}}`);
        const compiler = srcCompilers.get(srcFile);
        return compiler.stream().pipe(res);
      }
    }

    // otherwise give up
    return next();
  }
};
