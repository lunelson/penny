/************************************************/
/*                                  _           */
/*                                 (_)          */
/*     _ __   ___ _ __   __ _ _   _ _ _ __      */
/*    | '_ \ / _ \ '_ \ / _` | | | | | '_ \     */
/*    | |_) |  __/ | | | (_| | |_| | | | | |    */
/*    | .__/ \___|_| |_|\__, |\__,_|_|_| |_|    */
/*    | |                __/ |                  */
/*    |_|               |___/                   */
/************************************************/

/* COSMICONFIG -- https://github.com/davidtheclark/cosmiconfig */
// var cosmiconfig = require('cosmiconfig');
// var explorer = cosmiconfig('penguin');
// explorer.load('.')
//   .then((result) => {
//     // result.config is the parsed configuration object
//     // result.filepath is the path to the config file that was found
//   })
//   .catch((parsingError) => {
//     // do something constructive
//   });

const { stat } = require('fs');
const { parse } = require('url');
const { join, relative, resolve, extname } = require('path');
const _ = require('lodash');
const parseUrl = require('parseurl');

const isDev = true;
const baseDir = __dirname;

const reqSrcExt = { '.html': '.pug', '.css': '.scss', '.js': '.js' };
const srcOutExt = _.invert(reqSrcExt);
const changeTimes = _.mapValues(srcOutExt, Date.now);
const srcWares = _.mapValues(srcOutExt, (outExt, srcExt) => {
  return require(`./serve-${srcExt.slice(1)}.js`)(baseDir, changeTimes);
});

const serveIndex = require('serve-index');
const serveStatic = require('serve-static');
const serveStaticOptions = {
  redirect: false,
  extensions: ['html']
};

function serveSources(req, res, next) {
  let { pathname } = parse(req.url),
    ext = extname(pathname);
  if (!ext) {
    pathname = pathname.replace(/\/$/, '/index') + '.html';
    ext = '.html';
  }
  if (!~Object.keys(reqSrcExt).indexOf(ext)) {
    return next();
  } else {
    const reqFile = join(baseDir, pathname);
    return srcWares[reqSrcExt[ext]](reqFile, res, next);
  }
}

if (isDev) {
  // _
  // | |
  // | |__  ___ _   _ _ __   ___
  // | '_ \/ __| | | | '_ \ / __|
  // | |_) \__ \ |_| | | | | (__
  // |_.__/|___/\__, |_| |_|\___|
  //             __/ |
  //            |___/

  const bsync = require('browser-sync').create();
  bsync.init(
    {
      notify: false,
      open: false,
      server: { baseDir, serveStaticOptions },
      middleware: [serveSources]
    },
    function() {
      let watcherReady = false;
      const watcher = bsync
        .watch(
          Object.keys(srcOutExt).map(ext => `./**/*${ext}`),
          { ignored: ['**/node_modules/**'], ignoreInitial: true },
          (event, file) => {
            // console.log(event, join(baseDir, file));
            const srcExt = extname(file);
            // const outExt = outExts[srcExt];
            changeTimes[srcExt] = Date.now();
            // changeTimes2[join(baseDir, file)] = Date.now();
            if (watcherReady) bsync.reload(`*${srcOutExt[srcExt]}`);
          }
        )
        .on('ready', () => {
          watcherReady = true;
          // console.log(changeTimes2);
        });
    }
  );
} else {
  //                                  _
  //                                 | |
  //   ___ ___  _ __  _ __   ___  ___| |_
  //  / __/ _ \| '_ \| '_ \ / _ \/ __| __|
  // | (_| (_) | | | | | | |  __/ (__| |_
  //  \___\___/|_| |_|_| |_|\___|\___|\__|

  const http = require('http');
  const connect = require('connect');
  const app = connect();

  // app.use((req, res, next) => {
  //   const absFile = join(baseDir, parseUrl(req).pathname);
  //   // IF err or isDirectory, next
  //   // what if there's foo/ and foo.pug
  //   stat(absFile, (err, stats) => {
  //     if (!err) {
  //       console.log(`is dir: ${stats.isDirectory()}`);
  //       console.log(`is file: ${stats.isFile()}`);
  //     }
  //   });
  //   console.log(parseUrl(req));
  //   next();
  // });
  app.use(serveSources);
  app.use(serveStatic(baseDir, serveStaticOptions));
  // app.use(serveIndex(baseDir, { icons: true }));
  http.createServer(app).listen(3000);
}
