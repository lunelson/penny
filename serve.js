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

// _
// | |
// | |__  ___ _   _ _ __   ___
// | '_ \/ __| | | | '_ \ / __|
// | |_) \__ \ |_| | | | | (__
// |_.__/|___/\__, |_| |_|\___|
//             __/ |
//            |___/

const bsync = require('browser-sync').create();

// var serveIcons = require("serve-favicon");
// var serveIndex = require("serve-index");
const srcExts = { '.html': '.pug', '.css': '.scss', '.js': '.js' };
const outExts = _.invert(srcExts);
// const startTime = Date.now();
const changeTimes = _.mapValues(outExts, Date.now);
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

const baseDir = __dirname;

const subWares = {
  '.html': require('./serve-html')(baseDir, changeTimes),
  '.css': require('./serve-css')(baseDir, changeTimes),
  '.js': require('./serve-js')(baseDir, changeTimes),
}

function srcWare(req, res, next) {
  let ext = extname(req.url);
  if (!ext) {
    req.url = req.url.replace(/\/?$/, '/index.html');
    ext = '.html';
  }
  if (!~Object.keys(subWares).indexOf(ext)) return next();
  return subWares[ext](join(__dirname, req.url), res, next);
}

bsync.init(
  {
    notify: false,
    open: false,
    server: '.',
    middleware: [srcWare]
  },
  function() {
    let watcherReady = false;
    const watcher = bsync.watch(
      Object.keys(outExts).map(ext => `./**/*${ext}`),
      { ignored: ['**/node_modules/**'], ignoreInitial: true },
      (event, file) => {
        // console.log(event, join(__dirname, file));
        const srcExt = extname(file);
        // const outExt = outExts[srcExt];
        changeTimes[srcExt] = Date.now();
        // changeTimes2[join(__dirname, file)] = Date.now();
        if (watcherReady) bsync.reload(`*${outExts[srcExt]}`);
      }
    ).on('ready', () => {
      watcherReady = true;
      // console.log(changeTimes2);
    });
  }
);
