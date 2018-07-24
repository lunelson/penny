const _ = require('lodash');
const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');
const parseUrl = require('parseurl');
const http2 = require('http2');
const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const grayMatter = require('gray-matter');
const readData = require('read-data');
const toStream = require('to-readable-stream');

const bsync = require('browser-sync').create();
const inject = require('bs-html-injector');

const serveFavicon = require('serve-favicon')(resolve(__dirname, './favicon.ico'));
const serveStaticOptions = { extensions: ['html'] };

const { pennyLogger } = require('./loggers.js');
const { bundleCache, memoryFs, syncFileTree, $data, $dataSyncer, $pagesSyncer } = require('./caches.js');
const { extContentTypes, Deferral, replaceExt, removeExt } = require('./misc-penny.js');

module.exports = function(srcDir, options) {

  // PENNY VARS
  const { logLevel, isHTTPS } = options;
  const srcOutExts = {
    // '.html': '.html',
    // '.css': '.css',
    '.md': '.html',
    '.pug': '.html',
    '.scss': '.css',
    '.js': '.js',
  };
  const outSrcExts = {
    '.html': ['.pug', '.md'],
    '.css': ['.scss'],
    '.js': ['.js'],
  };
  const srcExts = Object.keys(srcOutExts);
  const outExts = Object.keys(outSrcExts);

  // JS VARS
  const jsCompiler = require('./compile-js')(srcDir);
  const jsFiles = new Set(); jsCompiler.init(jsFiles);
  const restartJsCompiler = _.debounce(() => jsCompiler.restart(), 150);

  // MD/PUG/SASS VARS
  let srcCompilersReady = false;
  const srcCompilers = new Map();

  const MdCompiler = require('./compile-md')(srcDir, options);
  const PugCompiler = require('./compile-pug')(srcDir, options);
  const ScssCompiler = require('./compile-scss')(srcDir, options);

  // BSYNC VARS
  let allReady = false;
  if (!isHTTPS) bsync.use(inject);

  // TODO: make a smarter debounce, that collects the outExts and sends them ALL in the debounced call
  const bsyncRefresh = _.debounce(outExt => {
    if (allReady) {
      if (outExt == '.html' && !isHTTPS) {
        pennyLogger.debug(`Injecting ${outExt}`);
        return inject();
      } else {
        pennyLogger.debug(`Reloading ${outExt}`);
        bsync.reload(`*${outExt}`);
      }
    }
  }, 150);

  // DATA & PAGES TRACKING

  const fileEvents = ['change', 'add', 'unlink'];
  const dataTreeSync = $dataSyncer(srcDir);
  const pagesMapSync = $pagesSyncer(srcDir);

  function htmlRefresh() {
    srcCompilers.forEach(compiler => {
      if (~outSrcExts['.html'].indexOf(extname(compiler.srcFile))) delete compiler.outCache;
    });
    bsyncRefresh('.html');
  }

  const dataWatching = new Promise((resolve, reject) => {
    // try {} catch(err) { reject(err); }
    bsync.watch(['_data/**/*.(js|json|yml|yaml|csv)'], {
      ignored: ['**/node_modules/**'],
      cwd: srcDir
    }, (event, file) => {
      if (!~fileEvents.indexOf(event)) return;
      dataTreeSync(event, file);
      htmlRefresh();
    }).on('ready', resolve);
  }).catch(err => pennyLogger.error(err.toString()));

  const pageWatching = new Promise((resolve, reject) => {
    // try {} catch(err) { reject(err); }
    bsync.watch(['**/*.(pug|md|html)'], {
      ignored: ['**/node_modules/**'],
      cwd: srcDir
    }, (event, relFile) => {
      if (!~fileEvents.indexOf(event)) return;
      pagesMapSync(event, relFile);
      htmlRefresh();
    }).on('ready', resolve);
  }).catch(err => pennyLogger.error(err.toString()));

  // SRC FILES TRACKING

  const srcWatching = Promise.all([ dataWatching, pageWatching ]).then(() => {
    bsync.watch(['**/*.(html|pug|md|css|scss)'], {
      ignored: ['**/node_modules/**'],
      cwd: srcDir
    }, (event, relFile) => {
      if (!~fileEvents.indexOf(event)) return;
      const srcExt = extname(relFile);
      const outExt = srcOutExts[srcExt] || srcExt;
      const srcFile = join(srcDir, relFile);
      if (anymatch(['**/*.(pug|md|scss)'], relFile)) {
        if (!anymatch(['**/_*/**/*.*', '**/_*.*'], relFile)) {
          if (event == 'unlink') { srcCompilers.delete(srcFile); }
          else if (!srcCompilers.has(srcFile)) {
            let valid = true;
            if (srcExt == '.md') {
              const { data } = grayMatter(readFileSync(srcFile, 'utf8'));
              if (!('layout' in data)) valid = false;
              // NOTE: the following is a build condition only
              // if (!isDev && data.publish == false) valid = false;
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
        if (srcCompilersReady) {
          srcCompilers.forEach(srcCompiler => srcCompiler.check(srcFile));
        }
      }
      bsyncRefresh(outExt);
    }).on('ready', () => { srcCompilersReady = true; });
  }).catch(err => pennyLogger.error(err.toString()));

  // JS FILES TRACKING (entry points only)

  const jsWatching = new Promise((resolve, reject) => {
    bsync.watch(['**/*.js'], {
      ignored: [ '**/_*/**/*.*', '**/_*.*', '**/node_modules/**'],
      cwd: srcDir
    }, (event, file) => {
      if (!~fileEvents.indexOf(event)) return;
      if (event == 'add' || event == 'unlink') {
        jsFiles[{ add: 'add', unlink: 'delete' }[event]](file);
        event == 'unlink' && delete bundleCache[join(srcDir, file)];
        if (jsCompiler.watching) restartJsCompiler();
      }
      bsyncRefresh('.js');
    }).on('ready', () => { resolve(); jsCompiler.start(); });
  }).catch(err => pennyLogger.error(err.toString()));

  // BSYNC INIT

  const bsyncRunning = new Promise((resolve, reject) => {
    bsync.init({
      notify: false,
      files: false,
      open: false,
      logLevel,
      logPrefix: 'BS', // conform to html injector
      server: { baseDir: srcDir, serveStaticOptions },
      middleware: [ serveFavicon, srcController ],
      httpModule: http2,
      https: isHTTPS,
    }, resolve);
  }).catch(err => pennyLogger.error(err.toString()));

  Promise.all([dataWatching,pageWatching,jsWatching,srcWatching,bsyncRunning]).then(() => {
    allReady = true;
    console.log(srcCompilers.entries());
  });

  function setHeaders(res, ext) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', extContentTypes[ext]);
  }

  function srcController(req, res, next) {
    let { pathname:reqFile } = parseUrl(req),
      reqExt = extname(reqFile);

      // BAIL if file path contains leading underscore (hidden files)
    if (anymatch(['**/_*/**/*.*', '**/_*.*'], reqFile)) {
      res.writeHead(403, 'Forbidden');
      res.end('This request path contains an underscore-prefixed folder or file. These are not served or built by Penny.');
      return false;
    }

    // BAIL if file ext is not .html, .css or .js
    if (!reqExt) { reqExt = '.html'; reqFile = reqFile.replace(/\/$/, '/index') + reqExt; }
    if (!~outExts.indexOf(reqExt)) return next();

    const outFile = join(srcDir, reqFile);

    // IF JS
    if (reqExt == '.js') {
      if (outFile in bundleCache) {
        setHeaders(res, '.js');
        pennyLogger.debug(`Served from bundleCache: {magenta:${relative(srcDir, outFile)}}`);
        return bundleCache[outFile].then(buffer => toStream(buffer).pipe(res));
      } else {
        let memFile = false;
        try { memFile = memoryFs.statSync(outFile).isFile(); }
        catch(err) { return next(); }
        if (memFile) {
          setHeaders(res, '.js');
          pennyLogger.debug(`Served from memoryFs: {magenta:${relative(srcDir, outFile)}}`);
          return memoryFs.createReadStream(outFile).pipe(res);
        }
      }
    }

    // IF SRC
    else {
      const srcFile = outSrcExts[reqExt]
        .map(srcExt => replaceExt(outFile, srcExt))
        .find(srcFile => srcCompilers.has(srcFile));

      if (srcFile) {
        setHeaders(res, extname(srcFile));
        pennyLogger.debug(`Served via compiler: {magenta:${relative(srcDir, srcFile)}}`);
        const compiler = srcCompilers.get(srcFile);
        return compiler.stream().pipe(res);
      }
    }

    // BAIL
    return next();
  }
};
