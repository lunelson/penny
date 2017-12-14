'use-strict';

// https://github.com/davidtheclark/cosmiconfig
const cosmiconfig = require('cosmiconfig');
const { stat } = require('fs');
const { join, relative, resolve, extname } = require('path');
const parseUrl = require('parseurl');
const chalk = require('chalk');
const _ = require('lodash');


module.exports = function pennyServe(baseDir, isDev = true) {

  const stopDir = process.cwd();
  const pennyrcLoader = cosmiconfig('penny', { stopDir, rcExtensions: true })
    .load(baseDir)
    .then((result) => result.config)
    .catch(() => Object.create(null));

  // const eslintrcLoader = cosmiconfig('eslint', { stopDir, rcExtensions: true })
  //   .load(baseDir)
  //   .then((result) => result.config)
  //   .catch(() => Object.create(null));

  // const stylelintrcLoader = cosmiconfig('stylelint', { stopDir, rcExtensions: true })
  //   .load(baseDir)
  //   .then((result) => result.config)
  //   .catch(() => Object.create(null));

  // const rolluprcLoader = cosmiconfig('rollup', { stopDir, rcExtensions: true })
  //   .load(baseDir)
  //   .then((result) => result.config)
  //   .catch(() => Object.create(null));

  // const babelrcLoader = cosmiconfig('babel', { stopDir, rcExtensions: true })
  //   .load(baseDir)
  //   .then((result) => result.config)
  //   .catch(() => Object.create(null));


  const pennyOptions = {
    data: '', // WIP
    browsersList: ['last 2 versions', 'safari 7'], // WIP
    eslint: false,
    stylelint: false,
    reqSrcExt: {
      '.html': '.pug',
      '.css': '.scss',
      '.js': '.js'
    }
  };

  Promise.all([pennyrcLoader]).then(([pennyrcOptions])=>{

    // INITS
    Object.assign(pennyOptions, pennyrcOptions);
    const { reqSrcExt } = pennyOptions;
    const srcOutExt = _.invert(reqSrcExt);
    const changeTimes = _.mapValues(srcOutExt, Date.now);
    const sourceWares = _.mapValues(srcOutExt, (outExt, srcExt) => {
      return require(`./lib/serve-${srcExt.slice(1)}.js`)(baseDir, isDev, changeTimes, pennyOptions);
    });

    // COMMON MIDDLEWARE
    const serveFavicon = require('serve-favicon')(resolve(__dirname, './lib/favicon.ico'));
    const serveStaticOptions = { extensions: ['html'] };

    // SOURCE MIDDLEWARE
    function serveSources(req, res, next) {
      let { pathname } = parseUrl(req),
        ext = extname(pathname);
      /*
        A. resolve extension if none present
        - if: foo, seek foo.html
        - if: foo/ seek foo/index.html
        - else: fall-through, connect will redirect if necessary
      */
      if (!ext) {
        ext = '.html';
        pathname = pathname.replace(/\/$/, '/index') + ext;
      }
      /*
        B. fall through, if the file extension is still not one that we care about
      */
      if (!~Object.keys(reqSrcExt).indexOf(ext)) { return next(); }
      /*
        C. else proceed to sourceWare
      */
      else {
        const reqFile = join(baseDir, pathname);
        return sourceWares[reqSrcExt[ext]](reqFile, res, next);
      }
    }

    // SERVERS
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
        server: { baseDir, serveStaticOptions },
        logPrefix: 'penny',
        middleware: [ serveFavicon, logger, serveSources ]
      },
      function () {
        let watcherReady = false;
        bsync
          .watch(
            // TODO: optionally add /**/*.json watch here
            // ...which would reset all other srcExt changeTimes
            Object.keys(srcOutExt).map(srcExt => `${baseDir}/**/*${srcExt}`), {
              ignored: ['**/node_modules/**'],
              ignoreInitial: true
            },
            (event, file) => {
              const srcExt = extname(file);
              changeTimes[srcExt] = Date.now();
              if (watcherReady) {
                bsync.reload(`*${srcOutExt[srcExt]}`);
              }
            }
          )
          .on('ready', () => (watcherReady = true));
      });
    } else {

      const http = require('http');
      const connect = require('connect');
      const serveStatic = require('serve-static');
      const app = connect();

      app.use(serveFavicon);
      app.use(serveSources);
      app.use(serveStatic(baseDir, serveStaticOptions));
      http.createServer(app).listen(3000);

      console.log(`[${chalk.blue('penny')}] Serving files from: ${chalk.magenta(baseDir)}`);

    }
  });

  function sourceWare(srcExt, options) {
    // closure refs
    const renderCache = {};
    const renderTimes = {};
    const renderFn = require(`./render-${srcExt.slice(1)}`)(baseDir, isDev, options);
    const loggerFn = debug(`penny:${srcExt.slice(1)}`);
    // middleware function
    return function(reqFile, res, next) {

      // check for reqFile
      stat(reqFile, (err, stats) => {

        // bail, if reqFile exists
        if (!err && stats.isFile()) return next();

        // check for srcFile,
        const srcFile = replaceExt(reqFile, srcExt);
        stat(srcFile, (err, stats) => {

          // bail, if srcFile does not exist
          if (err || !stats.isFile()) return next();

          // set header
          res.setHeader('Content-Type', 'text/css; charset=utf-8');

          // if renderCache is invalid, re-render and update renderTime
          if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
            renderCache[srcFile] = renderFn(srcFile, renderTimes);
          }

          // resolve renderCache, then
          renderCache[srcFile].then(data => {

            // log change/render/serve stats
            loggerFn(
              `${relative(baseDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${
                renderTimes[srcFile]
              } \nserved: ${Date.now()}`
            );

            // serve data
            res.end(data);
          });
        });
      });
    };
  }
};
