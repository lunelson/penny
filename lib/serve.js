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

const { pennyLogger } = require('./logger.js');
const { bufferCache, memoryFs } = require('./cache.js');
const { extContentTypes, Deferral, replaceExt, sliceExt, syncFileTree, $data, $pagesSyncer } = require('./misc-penny.js');

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

  function syncSrcCompilers(event, file) {
    const srcFile = join(srcDir, file);
    const srcExt = extname(file);
    if (event == 'unlink') {
      srcCompilers.delete(srcFile);
      delete bufferCache[srcFile];
      return;
    }
    if (event == 'add') {
      const SrcCompiler = {
        '.md': MdCompiler,
        '.pug': PugCompiler,
        '.scss': ScssCompiler
      }[srcExt];
      srcCompilers.set(srcFile, new SrcCompiler(srcFile));
      return;
    }
  }

  // DATA VARS
  // const { $data, $pages } = require('./locals.js');

  // BSYNC VARS
  let allReady = false;
  if (!isHTTPS) bsync.use(inject);
  const bsyncReload = _.debounce(outExt => {
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

  // DATA TRACKING
  const dataWatching = new Promise((resolve, reject) => {
    bsync.watch(['_data/**/*.(js|json|yml|yaml)'], {
      ignored: '**/node_modules/**',
      cwd: srcDir
    }, (event, file) => {
      syncFileTree($data, event, file, file => {
        if (extname(file) == '.js') return require(join(srcDir, file));
        return readData.sync(join(srcDir, file));
      });
      if (srcCompilersReady) {
        // all html compilers should re-render (but not re-compile)
        srcCompilers.forEach(compiler => {
          if (~outSrcExts['.html'].indexOf(extname(compiler.srcFile))) {
            compiler.render();
          }
        });
      }
      bsyncReload('.html');
    }).on('ready', resolve);
  }).catch(err => pennyLogger.error(err.toString()));

  // PAGES TRACKING
  const pageMapSync = $pagesSyncer(srcDir);
  const pageWatching = new Promise((resolve, reject) => {
    bsync.watch(['**/*.(pug|md|html)'], {
      ignored: [ '**/_*/**/*.*', '**/_*.*', '**/node_modules/**'],
      cwd: srcDir
    }, (event, relFile) => {
      // sync $pages map
      pageMapSync(event, relFile);
      // re-render all *other* html compilers
      if (srcCompilersReady) {
        const eventFile = join(srcDir, relFile);
        srcCompilers.forEach(compiler => {
          const srcFile = compiler.srcFile; const srcExt = extname(srcFile);
          if (~outSrcExts['.html'].indexOf(srcExt) && (srcFile !== eventFile)) {
            compiler.render();
          }
        });
      }
      // reload bsync
      bsyncReload('.html');
    }).on('ready', resolve);
  }).catch(err => pennyLogger.error(err.toString()));

  // JS FILES TRACKING (entry points only)
  const jsWatching = new Promise((resolve, reject) => {
    bsync.watch(['**/*.js'], {
      ignored: [ '**/_*/**/*.*', '**/_*.*', '**/node_modules/**'],
      cwd: srcDir
    }, (event, file) => {
      if (event == 'add' || event == 'unlink') {
        jsFiles[{ add: 'add', unlink: 'delete' }[event]](file);
        event == 'unlink' && delete bufferCache[join(srcDir, file)];
        if (jsCompiler.watching) restartJsCompiler();
      }
      bsyncReload('.js');
    }).on('ready', () => { resolve(); jsCompiler.start(); });
  }).catch(err => pennyLogger.error(err.toString()));

  // SRC FILES TRACKING
  const srcWatching = Promise.all([dataWatching,pageWatching]).then(() => {
    bsync.watch(['**/*.(pug|scss|md)'], {
      ignored: ['**/node_modules/**'],
      cwd: srcDir
    }, (event, file) => {
      const ext = extname(file);
      const outExt = srcOutExts[ext] || ext;
      if ((event == 'add' || event == 'unlink') && !anymatch(['**/_*/**/*.*', '**/_*.*'], file)) syncSrcCompilers(event, file);
      if (srcCompilersReady) {
        srcCompilers.forEach(srcCompiler => srcCompiler.depcheck(join(srcDir, file)));
        bsyncReload(outExt);
      }
    }).on('ready', () => { srcCompilersReady = true; });
  }).catch(err => pennyLogger.error(err.toString()));

  // const srcWatching = new Promise((resolve, reject) => {
  // SRC FILES TRACKING
  //   bsync.watch(['**/*.(pug|scss|md)'], {
  //     ignored: ['**/node_modules/**'],
  //     cwd: srcDir
  //   }, (event, file) => {
  //     const ext = extname(file);
  //     const outExt = srcOutExts[ext] || ext;
  //     if ((event == 'add' || event == 'unlink') && !anymatch(['**/_*/**/*.*', '**/_*.*'], file)) syncSrcCompilers(event, file);
  //     if (srcCompilersReady) {
  //       srcCompilers.forEach(srcCompiler => srcCompiler.depcheck(join(srcDir, file)));
  //       bsyncReload(outExt);
  //     }
  //   }).on('ready', () => { resolve(); srcCompilersReady = true; });
  // }).catch(err => pennyLogger.error(err.toString()));

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
    // console.log(Object.keys(bufferCache));
    // console.log(srcCompilers.entries());
  });

  function srcController(req, res, next) {
    let { pathname } = parseUrl(req), ext = extname(pathname);

    // BAIL if file path contains leading underscore (hidden files)
    if (anymatch(['**/_*/**/*.*', '**/_*.*'], pathname)) {
      res.writeHead(403, 'Forbidden');
      res.end('This request path contains an underscore-prefixed folder or file. These are not served or built by Penny.');
      return false;
    }

    // BAIL if file ext is not .html, .css or .js
    if (!ext) { ext = '.html'; pathname = pathname.replace(/\/$/, '/index') + ext; }
    if (!~outExts.indexOf(ext)) return next();

    // FIND in bufferCache
    const reqFile = join(srcDir, pathname);
    let srcFile = outSrcExts[ext].map(srcExt => replaceExt(reqFile, srcExt)).find(srcFile => srcFile in bufferCache);
    if (srcFile) {
      pennyLogger.debug(`Served from bufferCache: {magenta:${relative(srcDir, srcFile)}}`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', extContentTypes[extname(srcFile)]);
      return bufferCache[srcFile].then(buffer => toStream(buffer).pipe(res));
    }

    // FIND in memoryFs
    srcFile = outSrcExts[ext].map(srcExt => replaceExt(reqFile, srcExt)).find(srcFile => {
      try { return memoryFs.statSync(srcFile).isFile() } catch(err) { return null }
    });
    if (srcFile) {
      pennyLogger.debug(`Served from memoryFs: {magenta:${relative(srcDir, srcFile)}}`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', extContentTypes[extname(srcFile)]);
      return memoryFs.createReadStream(srcFile).pipe(res);
    }

    // fuck it
    return next();
  }
};
