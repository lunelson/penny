'use-strict';

//                               _                        _
//                              (_)                      (_)
//  _ __   ___ _ __   __ _ _   _ _ _ __ ______ __ _ _ __  _
// | '_ \ / _ \ '_ \ / _` | | | | | '_ \______/ _` | '_ \| |
// | |_) |  __/ | | | (_| | |_| | | | | |    | (_| | |_) | |
// | .__/ \___|_| |_|\__, |\__,_|_|_| |_|     \__,_| .__/|_|
// | |                __/ |                        | |
// |_|               |___/                         |_|

// https://github.com/davidtheclark/cosmiconfig
const cosmiconfig = require('cosmiconfig');

const { stat } = require('fs');
const { join, relative, resolve, extname } = require('path');
// const { parse } = require('url');
const parseUrl = require('parseurl');

const _ = require('lodash');


module.exports = function penguin(baseDir, isDev = true) {

  const procDir = process.cwd();
  // const pennyConfig = cosmiconfig('penny', { stopDir: procDir, rcExtensions: true });
  // const eslintConfig = cosmiconfig('eslint', { stopDir: procDir, rcExtensions: true });
  // const stylelintConfig = cosmiconfig('stylelint', { stopDir: procDir, rcExtensions: true });
  // const rollupConfig = cosmiconfig('rollup', { stopDir: procDir, rcExtensions: true });
  // const babelConfig = cosmiconfig('babel', { stopDir: procDir, rcExtensions: true });

  const rcFinder = cosmiconfig('penguin', { stopDir: procDir, rcExtensions: true })
    .load(baseDir)
    .then((result) => result.config)
    .catch(() => Object.create(null));

  // TODO: add more finders?
  // e.g. eslintFinder, stylelintFinder -> could be added to CSS chain

  const options = {
    data: '', // WIP
    browsersList: ['last 2 versions', 'safari 7'], // WIP
    reqSrcExt: {
      '.html': '.pug',
      '.css': '.scss',
      '.js': '.js'
    }
  };

  Promise.all([rcFinder]).then(([rcOptions])=>{

    // TEST
    // console.log(baseDir, isDev, rcOptions);

    // SETUP
    Object.assign(options, rcOptions);
    const { reqSrcExt } = options;
    const srcOutExt = _.invert(reqSrcExt);
    const changeTimes = _.mapValues(srcOutExt, Date.now);
    const sourceWares = _.mapValues(srcOutExt, (outExt, srcExt) => {
      return require(`./lib/serve-${srcExt.slice(1)}.js`)(baseDir, isDev, changeTimes, options);
    });

    const serveStatic = require('serve-static');
    const serveStaticOptions = { extensions: ['html'] };

    function serveSources(req, res, next) {
      let { pathname } = parseUrl(req),
        ext = extname(pathname);
      if (!ext) {
        // foo -> foo.html, foo/ -> foo/index.html
        // (if neither of these match, it will fall through and redirect)
        ext = '.html';
        pathname = pathname.replace(/\/$/, '/index') + ext;
      }
      if (!~Object.keys(reqSrcExt).indexOf(ext)) { return next(); }
      else {
        const reqFile = join(baseDir, pathname);
        return sourceWares[reqSrcExt[ext]](reqFile, res, next);
      }
    }

    // INIT

    if (isDev) {

      const bsync = require('browser-sync').create();
      const morgan = require('morgan');

      bsync.init({
        notify: false,
        open: false,
        server: { baseDir, serveStaticOptions },
        logPrefix: 'penguin',
        middleware: [
          morgan('dev', {
            skip: function (req, res) {
              return res.statusCode < 300;
            }
          }),
          serveSources
        ]
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
      const app = connect();

      app.use(serveSources);
      app.use(serveStatic(baseDir, serveStaticOptions));
      http.createServer(app).listen(3000);
    }
  });
};