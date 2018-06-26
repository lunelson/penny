'use-strict';

const _ = require('lodash');
const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat } = require('fs');
const parseUrl = require('parseurl');
const http2 = require('http2');

const rrddir = require('recursive-readdir');
const mmatch = require('micromatch'); // https://github.com/micromatch/micromatch

const readData = require('read-data');

const srcContentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.scss': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.pug': 'text/html; charset=utf-8',
  '.md': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const renderCache = {};
const renderTimes = {};

function replaceExt(filepath, ext) {
  return filepath.trim().replace(new RegExp(`${extname(filepath)}$`), ext);
}

// http://www.xiconeditor.com/
// https://realfavicongenerator.net/
const serveFavicon = require('serve-favicon')(resolve(__dirname, './favicon.ico'));

const serveStaticOptions = { extensions: ['html'] };

// eazy-logger https://github.com/shakyShane/eazy-logger/blob/master/index.js
const loggerFn = require('eazy-logger').Logger({
  prefix: '[{blue:penny}] ',
  useLevelPrefixes: true
});

function sliceExt(str) {
  const extIndex = str.lastIndexOf('.');
  return ~extIndex ? str.slice(0, extIndex) : str;
}

function syncFileObj(obj, file, event, cb) {
  const path = sliceExt(file).split('/').slice(1);
  if (event == 'unlink') {
    _.unset(obj, path);
    while (--path.length && _.isEmpty(_.get(obj, path))) {
      _.unset(obj, path);
    }
  } else _.set(obj, path, cb(file));
}

module.exports = function(srcDir, options) {

  const { reqSrcExt, isDev, logLevel } = options;
  const srcOutExt = _.invert(reqSrcExt);
  const srcExts = Object.keys(srcOutExt);
  const outExts = Object.keys(reqSrcExt);
  const changeTimes = _.mapValues(srcOutExt, Date.now);
  const srcServerFns = _.mapValues(srcOutExt, (outExt, srcExt) => srcServer(srcExt));

  loggerFn.setLevel(logLevel);
  // loggerFn.setLevel('debug');

  if (isDev) {

    const bsync = require('browser-sync').create();
    const inject = require('bs-html-injector');
    const logger = require('morgan')('dev', {
      skip: function (req, res) {
        return res.statusCode < 300;
      }
    });

    const baseDir = srcDir;
    const isHTTPS = false;

    // capturing eazy-logger instance from bsync instance
    // eazy-logger: https://github.com/shakyShane/eazy-logger
    // tfunk: https://github.com/shakyshane/tfunk
    // colors reference: https://github.com/chalk/chalk#colors
    // bsync.instance.logger.error('{red:%s', 'test error');
    // bsync.instance.logger.info('{cyan:%s', 'this info');
    // bsync.instance.logger.warn('{yellow:%s', 'test warning');
    // bsync.instance.logger.debug('{magenta:%s', 'test debug');

    bsync.use(inject);

    let bsyncReady = false;

    const $data = Object.create(null);
    bsync.watch(['_data/**/*.(json|yml|yaml)'], {
      ignored: '**/node_modules/**',
      cwd: srcDir
    }, (event, file) => {
      syncFileObj($data, file, event, file => (join(srcDir, file)));
      // console.log(JSON.stringify($data));
      if (bsyncReady) {
        if (!isHTTPS) return inject();
        bsync.reload();
      }
    });

    bsync.watch(
      srcExts
        .concat(['.json', '.yml', '.yaml']) // remove soon
        .concat(outExts)
        .map(ext => `**/*${ext}`),
      {
        ignored: '**/node_modules/**',
        ignoreInitial: true,
        cwd: srcDir
      },
      (event, file) => {
        if (bsyncReady) {
          const srcExt = extname(file);
          const outExt = srcOutExt[srcExt] || srcExt;
          changeTimes[srcExt] = Date.now();
          if (outExt == '.html' && !isHTTPS) return inject();
          bsync.reload(`*${outExt}`);
        }
      }
    ).on('ready', () => (bsyncReady = true));

    bsync.init({
      notify: false,
      files: false,
      open: false,
      logLevel, // [info, warn, debug] (ascending verbosity)
      logPrefix: 'penny',
      server: { baseDir, serveStaticOptions },
      middleware: [ serveFavicon, logger, srcController ],
      httpModule: http2,
      https: isHTTPS,
      // cors: true,
      /* CORS
        ...seems like a good iedea; but would not be available in production-serve mode...
        best solution might be to add it to our middleware, as in this answer https://github.com/BrowserSync/browser-sync/issues/233#issuecomment-250512923
        otherwise:
          release notes: https://github.com/BrowserSync/browser-sync/releases/tag/v2.16.0
          SO discussion: https://stackoverflow.com/questions/17124600/how-can-i-add-cors-headers-to-a-static-connect-server
      */
    });
  } else {

  // rrddir(srcDir).then(files => {
  //   // console.log(files.map(file => file.replace(srcDir, '')));
  //   const dataFiles = mmatch(files, ['**/_data/**/*.(js|yml|yaml)']);
  //   console.log(dataFiles);

  //   // const copies = filesBySrc['other'].map((file) => cp(path.join(srcDir, file), path.join(outDir, file)));

  //   // Promise.all([...copies, ...srcRenders]).then(([...processed]) => {

  //   //   /**
  //   //    * SUCCESS
  //   //    */

  //   //   console.log(`processed ${processed.length} files`);
  //   // });
  // });

    const http = require('http');
    const connect = require('connect');
    const serveStatic = require('serve-static');
    const app = connect();

    app.use(serveFavicon);
    app.use(srcController);
    app.use(serveStatic(srcDir, serveStaticOptions));
    http.createServer(app).listen(3000);

    loggerFn.info(`Serving files from: ${srcDir}`);
  }

  /*
  SRC SERVER
  0. convert reqFile to srcFile
  1. check for srcFile;
  2. (bail, if srcFile does not exist)
  3a. set cache-control https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
  3b. set header per srcType
  4. if renderCache is invalid, re-render (renderFn also updates renderTime)
  5. await renderCache, then...
  5b. log change/render/serve stats
  5c. serve data
  */

  function srcServer(srcExt) {
    const renderFn = require(`./render-${srcExt.slice(1)}`)({srcDir, loggerFn: loggerFn, options});
    return function(reqFile, res, next) {
      const srcFile = replaceExt(reqFile, srcExt); // 0.
      stat(srcFile, (err, stats) => { // 1.
        if (err || !stats.isFile()) return next(); // 2.
        res.setHeader('Cache-Control', isDev?'no-cache':'public'); // 3a.
        res.setHeader('Content-Type', srcContentTypes[srcExt]); // 3b.
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) { // 4.
          renderTimes && (renderTimes[srcFile] = Date.now());
          renderCache[srcFile] = renderFn(srcFile);
        }
        renderCache[srcFile].then(data => { // 5.-5c.
          loggerFn.debug(`${relative(srcDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${renderTimes[srcFile]}\nserved: ${Date.now()}`);
          res.end(data);
        });
      });
    };
  }

  /*
  SRC CONTROLLER
  A. resolve extension if none present
  - if: foo, seek foo.html
  - if: foo/ seek foo/index.html
  - else: fall-through, connect will redirect if necessary
  B. fall through, if the file extension is still not one that we care about
  C. else proceed to sourceWare
  */

  function srcController(req, res, next) {
    let { pathname } = parseUrl(req),
      ext = extname(pathname);
    /*
    catch bad paths here with the same mmatch patters as in build.js (should be disable-able with option)
    res.statusCode(403)
    res.statusMessage('Forbidden')
    res.end('This request path contains an underscore-prefixed folder or file. These are not served or built by Penny.')
    */
    // A
    if (!ext) { ext = '.html'; pathname = pathname.replace(/\/$/, '/index') + ext; }
    // B
    if (!~Object.keys(reqSrcExt).indexOf(ext)) { return next(); }
    // C
    else {
      const reqFile = join(srcDir, pathname);
      return srcServerFns[reqSrcExt[ext]](reqFile, res, next);
    }
  }
};
