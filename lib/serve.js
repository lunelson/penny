// built-in

const { relative, resolve, extname, join } = require('path');

// npm

const _ = require('lodash');
const parseUrl = require('parseurl');
const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const toStream = require('to-readable-stream');
const requireResolve = require('resolve');

// local
const { pennyLogger } = require('./loggers.js');
const { bufferCache, memoryFs } = require('./compile-js.js');
const { dataWatch, pageWatch } = require('./watch-meta.js');
const { srcWatch, srcCompilers } = require('./watch-src.js');
const { jsWatch } = require('./watch-js.js');

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
} = require('./misc-penny.js');

let allReady = false;
let jsCompilerReady = false;
let srcCompilersReady = false;

module.exports = function(srcDir, pubDir, options) {

  // NB re HTTP/2:
  // bsync does not yet support the native module; see
  // the supported one is node-http2, here:
  // the mechanics of node module name conflicts (see https://github.com/nodejs/http2/issues/29#issuecomment-268125271)
  // ...require the following form of requiring
  // httpModule: require(relative(__dirname, '../node_modules/http2')),
  const http2Module = require(requireResolve.sync('http2', { basedir: srcDir })); // force the indy module

  // get options; set/exec stuff if needed
  const { logLevel, browserSyncOptions, configDir } = options;

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
    try {
      dataWatcher(resolve, metaRefresh);
    } catch (err) {
      reject(err);
    }
  });

  const pageWatcher = pageWatch(pubDir);
  const pageWatching = new Promise((resolve, reject) => {
    try {
      pageWatcher(resolve, metaRefresh);
    } catch (err) {
      reject(err);
    }
  });

  // SRC WATCHING

  const srcWatcher = srcWatch(srcDir, pubDir, options);
  const srcWatching = Promise.all([dataWatching, pageWatching]).then(() =>
    new Promise((resolve, reject) => {
      try {
        srcWatcher(resolve, srcFile => {
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
      } catch (err) {
        reject(err);
      }
    }).then(() => {
      srcCompilersReady = true;
    }),
  );

  // JS WATCHING (entry points only)

  const jsWatcher = jsWatch(srcDir, pubDir, options);
  const jsWatching = new Promise((resolve, reject) => {
    try {
      jsWatcher(resolve, srcFile => {
        if (jsCompilerReady) {
          pennyLogger.debug('refreshing .js from jsWatching');
          bsyncRefresh(['.js']);
        }
      });
    } catch (err) {
      reject(err);
    }
  }).then(() => {
    jsCompilerReady = true;
  });

  // BSYNC INIT

  //fix ssl localhost
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  // pull the *allowed* options from the browserSyncOptions key in penny config
  // TODO: document these options
  // TODO: allow "cors" option for browserSync and set headers in middleware appropriately too
  const bsyncOptions = _.pick(browserSyncOptions, [
    'browser',
    'codeSync',
    'ghostMode',
    'https',
    'injectChanges',
    'notify',
    'open',
    'cors',
    'reloadDebounce',
    'reloadDelay',
    'reloadThrottle',
    // re snippetOptions
    // https://github.com/tomgenoni/browser-sync-block-iframe-example/blob/master/gulpfile.js
    // https://github.com/Browsersync/browser-sync/issues/553#issuecomment-103905358
    // https://browsersync.io/docs/options#option-snippetOptions
    'snippetOptions',
    'scrollElementMapping',
    'scrollElements',
    'scrollProportionally',
    'scrollRestoreTechnique',
    'scrollThrottle',
    'startPath',
    'timestamps',
    'tunnel',
  ]);

  // resolve https options relative to configDir
  // bsyncOptions.startPath
  const cert = bsyncOptions.https && bsyncOptions.https.cert && resolve(configDir, bsyncOptions.https.cert);
  const key = bsyncOptions.https && bsyncOptions.https.key && resolve(configDir, bsyncOptions.https.key);
  bsyncOptions.https = cert && key ? { cert, key } : bsyncOptions.https == true;

  const bsyncRunning = new Promise((resolve, reject) => {
    bsync.init(
      _.assign(
        {
          // these can be overridden
          open: false,
          cors: true,
          https: true,
          logLevel,
          notify: logLevel == 'debug',
          // these cannot be overriden
          files: false,
          server: { baseDir: pubDir },
          middleware: [serveFavicon, srcController],
          httpModule: http2Module,
          logPrefix: 'penny',
        },
        bsyncOptions,
      ),
      resolve,
    );
  });

  // faviconWare, compilerWare, memoryFsWare

  Promise.all([dataWatching, pageWatching, jsWatching, srcWatching, bsyncRunning])
    .then(() => {
      allReady = true;
    })
    .catch(err => pennyLogger.error(err.toString())); // catchAll catch!!

  function setHeaders(res, ext) {
    // res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', outExtContentTypes[ext]||'application/octet-stream');
  }

  function srcController(req, res, next) {
    let { pathname: reqFile } = parseUrl(req);

    // bail if file path contains leading underscore (hidden files)
    if (anymatch(['**/_*/**/*.*', '**/_*.*'], reqFile)) {
      res.writeHead(403, 'Forbidden');
      res.end(
        'This request path contains an underscore-prefixed folder or file. These are not served or built by Penny.',
      );
      return false;
    }

    // correct outExt to '.html' if empty; correct path to /index.html if reqFile has trailing slash
    let outExt = extname(reqFile);
    if (!outExt) { outExt = '.html'; reqFile = reqFile.replace(/\/$/, '/index') + outExt; }

    // calc absolute path of output file
    const outFile = join(pubDir, reqFile);

    // webpack: try memoryFs
    let memFile = false;
    try { memFile = memoryFs.statSync(outFile).isFile(); } catch (_) { /* memFile will remain false! */ }
    if (memFile) {
      setHeaders(res, outExt); // set headers
      pennyLogger.debug(`Served from memoryFs: {magenta:${reqFile}}`);
      return memoryFs.createReadStream(outFile).pipe(res);
    }

    // webpack: try bufferCache
    else if (outFile in bufferCache) {
      setHeaders(res, outExt); // set headers
      pennyLogger.debug(`Served from bufferCache: {magenta:${reqFile}}`);
      return bufferCache[outFile].then(buffer => toStream(buffer).pipe(res));
    }

    // src: bail if reqFile is not src, or if it is *minified* src
    if (!/\.(html|css|js)$/.test(reqFile) || /\.min\.(html|css|js)$/.test(reqFile)) return next();

    // src: see if any compilers have it
    else {
      const srcFile = outSrcExts[outExt] && outSrcExts[outExt]
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
