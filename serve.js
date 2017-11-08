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
/*
  penguin
    _internal
    _javascripts
    _stylesheets
    _templates
    app

    src
      mypen1
        index.pug
        local.scss
        local.js
      index.pug
      global.js
      global.scss
*/

const path = require("path");
const fs = require("fs");
const { join, relative, resolve, extname } = require("path");
const _ = require('lodash');

//   _
//   (_)
//    _ ___
//   | / __|
//   | \__ \
//   | |___/
//  _/ |
// |__/

const Rollup = require("rollup");
const nodeResolve = require("rollup-plugin-node-resolve");
const commonJS = require("rollup-plugin-commonjs");

function jsWare(changeTimes) {
  const ext = ".js",
    renderCache = {},
    bundleCache = {},
    config = {
      external: [],
      plugins: [
        nodeResolve(),
        commonJS(),
        // babel(),
        // replace({
        //   ENV: JSON.stringify(process.env.NODE_ENV || "development")
        // })
      ],
    };
  let renderTime = 0;

  return function(req, res, next) {
    const filename = join(__dirname, req.url);
    fs.stat(filename, (err, stats) => {
      if (!stats.isFile()) return next();
      // const now = Date.now();
      if (renderTime < changeTimes[ext]) {
        Rollup.rollup(Object.assign({}, config, { input: filename, cache: bundleCache[req.url] }))
        .then((bundle) => {
          bundleCache[req.url] = bundle;
          renderCache[req.url] = bundle.generate({
            format: "es",
            sourcemap: "inline"
          }).code;
          renderTime = Date.now();
        }, (err) => {
          if (err.code === "PARSE_ERROR") {
            console.error(
              "%s:%d:%d: %s",
              relative(resolve(process.cwd(), prefix), err.loc.file),
              err.loc.line,
              err.loc.column,
              err.message
            );
            console.error();
            console.error(err.frame);
            console.error();
            res.writeHead(500);
            res.end();
          } else if (err.code === "UNRESOLVED_ENTRY") {
            // Pass 404s on to the next middleware
            next();
          } else {
            next(err);
          }
        });
      }
      res.setHeader("Content-Type", "text/javascript");
      // res.end('IS THIS THING ON???');
      res.end(renderCache[req.url]);
    });
  };
}

// _ __  _   _  __ _
// | '_ \| | | |/ _` |
// | |_) | |_| | (_| |
// | .__/ \__,_|\__, |
// | |           __/ |
// |_|          |___/

const Pug = require('pug');
/*
  TODO
  - add utilities to pug locals
  - add pug-error rendering to HTML
*/
function pugWare(changeTimes) {
  const ext = ".pug",
    cache = {}, locals = {};
  let renderTime = 0, timeStats = '';
  return function(req, res, next) {
    const filename = join(__dirname, req.url);
    fs.readFile(filename, "utf8", (err, data) => {
      if (!data) return next();
      const now = Date.now();
      if (renderTime < changeTimes[ext]) {
        cache[req.url] = Pug.render(data.toString(), Object.assign({}, locals, {
          cache: false,
          pretty: true,
          basedir: __dirname,
          filename,
        }));
        timeStats = `${ext} file -- changed: ${changeTimes[ext]}; rendered: ${now};`;
        renderTime = now;
      }
      console.log(`${timeStats} served: ${now}`);
      res.end(cache[req.url]);
    });
  };
}

// ___  ___ ___ ___
// / __|/ __/ __/ __|
// \__ \ (__\__ \__ \
// |___/\___|___/___/

// function scssWare(changeTimes) {
//   const ext = ".scss",
//     cache = {};
//   let renderTime = 0;
//   return function(req, res, next) {
//     const now = Date.now();
//     if (renderTime < changeTimes[ext]) {
//       result = `${ext} render: ${now}; change: ${changeTimes[ext]}`;
//       cache[req.url] = result;
//       renderTime = now;
//     }
//     res.end(`${cache[req.url]}; serve: ${now}`);
//   };
// }

const scssWare = require('./serve-scss');
// _
// | |
// | |__  ___ _   _ _ __   ___
// | '_ \/ __| | | | '_ \ / __|
// | |_) \__ \ |_| | | | | (__
// |_.__/|___/\__, |_| |_|\___|
//             __/ |
//            |___/

const bsync = require("browser-sync").create();

// var serveIcons = require("serve-favicon");
// var serveIndex = require("serve-index");
const srcExts = { ".html": ".pug", ".css": ".scss", ".js": ".es" };
const outExts = _.invert(srcExts);
const startTime = Date.now();
const changeTimes = _.mapValues(outExts, () => startTime);
const changeTimes2 = {};
// const changeTimes = {
//   ".pug": startTime,
//   ".scss": startTime,
//   ".js": startTime
// };
const srcMiddleWares = {
  ".pug": pugWare(changeTimes),
  ".scss": scssWare(changeTimes2),
  ".js": jsWare(changeTimes)
};

const chokidarOptions = { ignored: ['**/node_modules/**'] };

bsync.init(
  {
    notify: false,
    open: false,
    server: ".",
    middleware: [
      // serveIcons,
      // serveIndex,
      function(req, res, next) {
        // console.log(req.url);
        let ext = extname(req.url);
        if (!ext) {
          req.url = req.url.replace(/\/?$/, "/index.html");
          ext = ".html";
        }
        if (!~Object.keys(srcExts).indexOf(ext)) return next();
        /*
          parse absFile from req.url
          call subWare[srcExt](relPath, baseDir, res, next)
        */
        fs.stat(path.join(__dirname, req.url), (err, stats) => {
          if (!err && stats.isFile()) { return next(); }
          else {
            const srcExt = srcExts[ext];
            req.url = req.url.replace(new RegExp(`${ext}$`), srcExt);
            return srcMiddleWares[srcExt](req, res, next);
          }
        });
      }
    ]
  },
  function() {
    let watcherReady = false;
    const watcher = bsync.watch(
      Object.keys(outExts).map(ext => `./**/*${ext}`),
      chokidarOptions,
      (event, file) => {
        // console.log(event, join(__dirname, file));
        const srcExt = extname(file);
        const outExt = outExts[srcExt];
        changeTimes[srcExt] = Date.now();
        changeTimes2[join(__dirname, file)] = Date.now();
        if (watcherReady) bsync.reload(`*${outExt}`);
      }
    ).on('ready', () => {
      watcherReady = true;
      console.log(changeTimes2);
    });
  }
);
