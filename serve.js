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

const path = require('path');
const fs = require('fs');
const { join, relative, resolve, extname } = require('path');
const _ = require('lodash');

// const jsWare = require('./serve-js');
// const pugWare = require('./serve-pug');
// const scssWare = require('./serve-scss');

//                                  _
//                                 | |
//   ___ ___  _ __  _ __   ___  ___| |_
//  / __/ _ \| '_ \| '_ \ / _ \/ __| __|
// | (_| (_) | | | | | | |  __/ (__| |_
//  \___\___/|_| |_|_| |_|\___|\___|\__|

const connect = require('connect');
const http = require('http');
const serveStatic = require('serve-static');
const serveIndex = require('serve-index');

// const isDev = true;
// if (!isDev) {
//   const app = connect();
//   app.use(srcHandler);
//   app.use(serveStatic(baseDir));
//   http.createServer(app).listen(3000);
// }

// _
// | |
// | |__  ___ _   _ _ __   ___
// | '_ \/ __| | | | '_ \ / __|
// | |_) \__ \ |_| | | | | (__
// |_.__/|___/\__, |_| |_|\___|
//             __/ |
//            |___/

const bsync = require('browser-sync').create();
const baseDir = __dirname;

// var serveIcons = require("serve-favicon");
// var serveIndex = require("serve-index");
const srcExts = { '.html': '.pug', '.css': '.scss', '.js': '.js' };
const outExts = _.invert(srcExts);
// const startTime = Date.now();
const changeTimes = _.mapValues(outExts, Date.now);
const srcWares = _.mapValues(srcExts, (val, key) => {
  return require(`./serve-${key.slice(1)}.js`)(baseDir, changeTimes);
});

// Object.keys(srcExts).map((ext) => `serve-${ext.slice(1)}`)
// const subMiddleWares = _.mapValues(srcExts, (ext) =>)
// console.log(changeTimes);
// const changeTimes2 = {};
// const changeTimes = {
//   ".pug": startTime,
//   ".scss": startTime,
//   ".js": startTime
// };
// const srcMiddleWares = {
//   '.pug': pugWare(changeTimes),
//   '.scss': scssWare(changeTimes2),
//   '.js': jsWare(changeTimes)
// };

// const subWares = {
//   '.html': require('./serve-html')(baseDir, changeTimes),
//   '.css': require('./serve-css')(baseDir, changeTimes),
//   '.js': require('./serve-js')(baseDir, changeTimes),
// };

function srcHandler(req, res, next) {
  let ext = extname(req.url);
  if (!ext) {
    req.url = req.url.replace(/\/?$/, '/index.html');
    ext = '.html';
  }
  if (!~Object.keys(srcWares).indexOf(ext)) return next();
  return srcWares[ext](join(baseDir, req.url), res, next);
}

bsync.init(
  {
    notify: false,
    open: false,
    server: '.',
    middleware: [srcHandler]
  },
  function() {
    let watcherReady = false;
    const watcher = bsync
      .watch(
        Object.keys(outExts).map(ext => `./**/*${ext}`),
        { ignored: ['**/node_modules/**'], ignoreInitial: true },
        (event, file) => {
          // console.log(event, join(baseDir, file));
          const srcExt = extname(file);
          // const outExt = outExts[srcExt];
          changeTimes[srcExt] = Date.now();
          // changeTimes2[join(baseDir, file)] = Date.now();
          if (watcherReady) bsync.reload(`*${outExts[srcExt]}`);
        }
      )
      .on('ready', () => {
        watcherReady = true;
        // console.log(changeTimes2);
      });
  }
);
