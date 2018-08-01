const _ = require('lodash');
const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');
const parseUrl = require('parseurl');
const http2 = require('http2');
const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const grayMatter = require('gray-matter');
const readData = require('read-data');
const toStream = require('to-readable-stream');
const junk = require('junk');

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

  // SRC FINDING, in order of priority
  // NB: html and css not included, because currently not processed; but eventually should be
  // NB: js not included because handled by jsWatcher
  const outSrcExts = {
    '.html': ['.pug', '.md', '.mdown', '.markdown'],
    '.css': ['.scss'],
  };
  // this is the reverse look-up of the above
  const srcOutExts = Object.keys(outSrcExts).reduce((obj, key) => {
    outSrcExts[key].forEach(ext => obj[ext] = key);
    return obj;
  }, {});

  const htmlSrcExtRE = outSrcExts['.html'].map(ext => ext.slice(1)).join('|');
  const allSrcExtRE = [].concat(..._.values(outSrcExts)).map(ext => ext.slice(1)).join('|');
  const junkRE = junk.regex;
  const debounceTime = 150;

  // JS COMPILER

  const jsCompiler = require('./compile-js')(srcDir, null, options);
  const jsFiles = new Set(); jsCompiler.init(jsFiles);
  const restartJsCompiler = _.debounce(() => jsCompiler.restart(), debounceTime);

  // SRC COMPILERS

  let srcCompilersReady = false;
  const srcCompilers = new Map();
  const MdCompiler = require('./compile-md.js')(srcDir, options);
  const PugCompiler = require('./compile-pug.js')(srcDir, options);
  const ScssCompiler = require('./compile-scss.js')(srcDir, options);

  // BSYNC VARS

  let allReady = false;
  if (!isHTTPS) bsync.use(inject);
  const bsyncRefresh = _.debounce(outExts => {
    if (allReady) {
      if (outExts.length == 1 && outExts[0] == '.html' && !isHTTPS) {
        pennyLogger.debug(`Injecting ${outExts[0]}`);
        return inject();
      } else {
        pennyLogger.debug(`Reloading ${outExts}`);
        bsync.reload(outExts.map(ext => `*${ext}`));
      }
    }
  }, debounceTime);

  // DATA & PAGES TRACKING

  const fileEvents = ['change', 'add', 'unlink'];
  const dataTreeSync = $dataSyncer(srcDir);
  const pagesMapSync = $pagesSyncer(srcDir);

  function dataRefresh() {
    srcCompilers.forEach(compiler => {
      if (~outSrcExts['.html'].indexOf(extname(compiler.srcFile))) {
        pennyLogger.debug(`deleting outCache for ${relative(srcDir, compiler.srcFile)}`);
        delete compiler.outCache;
      }
    });
    bsyncRefresh(['.html']);
  }

  const dataWatching = new Promise((resolve, reject) => {
    try {
      bsync.watch(['_data/**/*.(js|json|yml|yaml|csv)'], {
        ignored: ['**/node_modules/**'],
        cwd: srcDir
      }, (fsEvent, relFile) => {
        if (anymatch([junkRE], basename(relFile))) return;
        if (!~fileEvents.indexOf(fsEvent)) return;
        dataTreeSync(fsEvent, relFile);
        pennyLogger.debug('refreshing .html from dataWatching');
        dataRefresh();
      }).on('ready', resolve);
    } catch(err) { reject(err); }
  });

  const pageWatching = new Promise((resolve, reject) => {
    try {
      bsync.watch([`**/*.(${htmlSrcExtRE})`], { // TODO: abstract all these ext-matching regexes to config at top
        ignored: ['**/node_modules/**', '_data/**', '**/_*.*'], // TODO: review; disallow only _file, not _folder/file ?
        cwd: srcDir
      }, (fsEvent, relFile) => {
        if (anymatch([junkRE], basename(relFile))) return;
        if (!~fileEvents.indexOf(fsEvent)) return;
        pagesMapSync(fsEvent, relFile);
        pennyLogger.debug('refreshing .html from pageWatching');
        dataRefresh();
      }).on('ready', resolve);
    } catch(err) { reject(err); }
  });

  // SRC FILES TRACKING

  const srcWatching = Promise.all([ dataWatching, pageWatching ]).then(() => {
    try {
      return bsync.watch(['**/*'], {
        ignored: ['**/node_modules/**', '_data/**'],
        cwd: srcDir
      }, (fsEvent, relFile) => {
        if (anymatch([junkRE], basename(relFile))) return;
        if (!~fileEvents.indexOf(fsEvent)) return;
        const isCompilable = anymatch([`**/*.(${allSrcExtRE})`], relFile);
        const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relFile);
        const srcFile = join(srcDir, relFile);
        if (isCompilable && !isHidden) {
          if (fsEvent == 'unlink') { srcCompilers.delete(srcFile); }
          else if (!srcCompilers.has(srcFile)) {
            let valid = true;
            let srcExt = extname(relFile);
            if (srcExt != '.pug' && srcExt != '.scss') {
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
      }).on('ready', () => { srcCompilersReady = true; });
    } catch (err) { throw Error(err); }
  });

  // JS FILES TRACKING (entry points only)

  const jsWatching = new Promise((resolve, reject) => {
    try {
      bsync.watch(['**/*.js'], {
        ignored: ['**/_*/**/*.*', '**/_*.*', '**/node_modules/**'],
        cwd: srcDir
      }, (event, relFile) => {
        if (anymatch([junkRE], basename(relFile))) return;
        if (!~fileEvents.indexOf(event)) return;
        if (event == 'add' || event == 'unlink') {
          jsFiles[{ add: 'add', unlink: 'delete' }[event]](relFile);
          event == 'unlink' && delete bundleCache[join(srcDir, relFile)];
          if (jsCompiler.watching) restartJsCompiler();
        }
        pennyLogger.debug('refreshing .js from jsWatching');
        bsyncRefresh(['.js']);
      }).on('ready', () => { resolve(); jsCompiler.start(); });
    } catch(err) { reject(err); }
  });

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
  });

  Promise.all([dataWatching,pageWatching,jsWatching,srcWatching,bsyncRunning])
    .then(() => { allReady = true; })
    .catch(err => pennyLogger.error(err.toString())); // catchAll catch!!

  function setHeaders(res, ext) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', extContentTypes[ext]);
  }

  function srcController(req, res, next) {

    let { pathname:reqFile } = parseUrl(req), reqExt = extname(reqFile);

    // bail if file path contains leading underscore (hidden files)
    if (anymatch(['**/_*/**/*.*', '**/_*.*'], reqFile)) {
      res.writeHead(403, 'Forbidden');
      res.end('This request path contains an underscore-prefixed folder or file. These are not served or built by Penny.');
      return false;
    }

    // bail if file ext is not .html, .css or .js
    if (!reqExt) { reqExt = '.html'; reqFile = reqFile.replace(/\/$/, '/index') + reqExt; }
    if (!(reqExt in outSrcExts)) return next();

    const outFile = join(srcDir, reqFile);

    // if js
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

    // if src
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

    // give up
    return next();
  }
};
