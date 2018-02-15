'use-strict';

const _ = require('lodash');
const debug = require('debug');
const { relative, extname, join, resolve } = require('path');
const { stat } = require('fs');
const parseUrl = require('parseurl');
const chalk = require('chalk');

const srcContentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.scss': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.pug': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const renderCache = {};
const renderTimes = {};

function replaceExt(filepath, ext) {
  return filepath.trim().replace(new RegExp(`${extname(filepath)}$`), ext);
}

// FAVICON MIDDLEWARE
// http://www.xiconeditor.com/
// https://realfavicongenerator.net/
const serveFavicon = require('serve-favicon')(resolve(__dirname, './favicon.ico'));

const serveStaticOptions = { extensions: ['html'] };

module.exports = function(srcDir, options) {

  const { reqSrcExt, isDev } = options;
  const srcOutExt = _.invert(reqSrcExt);
  const srcExts = Object.keys(srcOutExt);
  const changeTimes = _.mapValues(srcOutExt, Date.now);
  const srcServerFns = _.mapValues(srcOutExt, (outExt, srcExt) => srcServer(srcExt));

  if (isDev) {

    const bsync = require('browser-sync').create();
    const logger = require('morgan')('dev', {
      skip: function (req, res) {
        return res.statusCode < 300;
      }
    });

    bsync.init({
      notify: false,
      open: false,
      server: { baseDir: srcDir, serveStaticOptions },
      logPrefix: 'penny',
      middleware: [ serveFavicon, logger, srcController ]
    },
    function () {
      let ready = false;
      bsync
        .watch(
          srcExts.concat(['.json', '.yml', '.yaml']).map(srcExt => `${srcDir}/**/*${srcExt}`), {
            ignored: ['**/node_modules/**'],
            ignoreInitial: true
          },
          (event, file) => {
            const srcExt = extname(file);
            changeTimes[srcExt] = Date.now();
            if (ready) {
              const match = srcOutExt[srcExt] || '';
              bsync.reload(`*${match}`);
            }
          }
        )
        .on('ready', () => (ready = true));
    });
  } else {

    const http = require('http');
    const connect = require('connect');
    const serveStatic = require('serve-static');
    const app = connect();

    app.use(serveFavicon);
    app.use(srcController);
    app.use(serveStatic(srcDir, serveStaticOptions));
    http.createServer(app).listen(3000);

    console.log(`[${chalk.blue('penny')}] Serving files from: ${chalk.magenta(srcDir)}`);
  }

  /*
    SRC SERVER
    0. convert reqFile to srcFile
    1. check for srcFile;
    2. (bail, if srcFile does not exist)
    3. set header per srcType
    4. if renderCache is invalid, re-render (renderFn also updates renderTime)
    5. await renderCache, then...
    5b. log change/render/serve stats
    5c. serve data
  */

  function srcServer(srcExt) {
    const loggerFn = debug(`penny:${srcExt.slice(1)}`);
    const renderFn = require(`./render-${srcExt.slice(1)}`)({srcDir, renderTimes, loggerFn, options});
    return function(reqFile, res, next) {
      const srcFile = replaceExt(reqFile, srcExt); // 0.
      stat(srcFile, (err, stats) => { // 1.
        if (err || !stats.isFile()) return next(); // 2.
        res.setHeader('Content-Type', srcContentTypes[srcExt]); // 3.
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) { // 4.
          renderCache[srcFile] = renderFn(srcFile);
        }
        renderCache[srcFile].then(data => { // 5.-5c.
          loggerFn(`${relative(srcDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${renderTimes[srcFile]}\nserved: ${Date.now()}`);
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
    // A
    if (!ext) {
      ext = '.html';
      pathname = pathname.replace(/\/$/, '/index') + ext;
    }
    // B
    if (!~Object.keys(reqSrcExt).indexOf(ext)) { return next(); }
    // C
    else {
      const reqFile = join(srcDir, pathname);
      return srcServerFns[reqSrcExt[ext]](reqFile, res, next);
    }
  }
};
