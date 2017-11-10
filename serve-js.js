//   _
//   (_)
//    _ ___
//   | / __|
//   | \__ \
//   | |___/
//  _/ |
// |__/

const { join, relative, resolve, extname } = require('path');
const { stat } = require('fs');
const { replaceExt } = require('./serve-utils');
const Rollup = require('rollup');
const nodeResolvePlugin = require('rollup-plugin-node-resolve');
const commonJsPlugin = require('rollup-plugin-commonjs');
const babelPlugin = require('rollup-plugin-babel');
const replacePlugin = require('rollup-plugin-replace');

///
/// SRCWARE
///

module.exports = function subWare(baseDir, changeTimes) {
  const renderCache = {};
  const renderTimes = {};
  const bundleCache = {};
  const srcExt = '.js';
  const config = {
    external: [],
    plugins: [
      nodeResolvePlugin(),
      commonJsPlugin(),
      babelPlugin(),
      replacePlugin({
        ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      })
    ]
  };
  // NB: we don't check reqFile vs srcFile here; they are the same
  return function(srcFile, res, next) {
    stat(srcFile, (err, stats) => {
      // bail, if srcFile does not exist
      if (err || !stats.isFile()) return next();
      const now = Date.now();
      // if renderCache invalid, re-render and update renderTime
      if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
        Rollup.rollup(
          Object.assign({}, config, {
            input: srcFile,
            cache: bundleCache[srcFile]
          })
        ).then(
          bundle => {
            bundleCache[srcFile] = bundle;
            bundle
              .generate({
                format: 'es',
                sourcemap: 'inline'
              })
              .then(data => {
                renderCache[srcFile] = data.code;
                renderTimes[srcFile] = now;
              });
          },
          err => {
            if (err.code === 'PARSE_ERROR') {
              console.error(
                '%s:%d:%d: %s',
                relative(__dirname, err.loc.file),
                err.loc.line,
                err.loc.column,
                err.message
              );
              console.error();
              console.error(err.frame);
              console.error();
              res.writeHead(500);
              res.end();
            } else if (err.code === 'UNRESOLVED_ENTRY') {
              // Pass 404s on to the next middleware
              next();
            } else {
              next(err);
            }
          }
        );
      }
      console.log(
        `${srcExt} file\n changed: ${changeTimes['.pug']} \n rendered: ${
          renderTimes[srcFile]
        } \n served: ${now}`
      );
      res.setHeader('Content-Type', 'text/javascript');
      res.end(renderCache[srcFile]);
    });
  };
};

// function jsWare(changeTimes) {
//   const ext = '.js',
//     renderCache = {},
//     bundleCache = {},
//     config = {
//       external: [],
//       plugins: [
//         nodeResolvePlugin(),
//         commonJsPlugin()
//         // babel(),
//         // replace({
//         //   ENV: JSON.stringify(process.env.NODE_ENV || "development")
//         // })
//       ]
//     };
//   let renderTime = 0;

//   return function(req, res, next) {
//     const filename = join(__dirname, req.url);
//     stat(filename, (err, stats) => {
//       if (!stats.isFile()) return next();
//       // const now = Date.now();
//       if (renderTime < changeTimes[ext]) {
//         Rollup.rollup(
//           Object.assign({}, config, { input: filename, cache: bundleCache[req.url] })
//         ).then(
//           bundle => {
//             bundleCache[req.url] = bundle;
//             renderCache[req.url] = bundle.generate({
//               format: 'es',
//               sourcemap: 'inline'
//             }).code;
//             renderTime = Date.now();
//           },
//           err => {
//             if (err.code === 'PARSE_ERROR') {
//               console.error(
//                 '%s:%d:%d: %s',
//                 relative(__dirname, err.loc.file),
//                 err.loc.line,
//                 err.loc.column,
//                 err.message
//               );
//               console.error();
//               console.error(err.frame);
//               console.error();
//               res.writeHead(500);
//               res.end();
//             } else if (err.code === 'UNRESOLVED_ENTRY') {
//               // Pass 404s on to the next middleware
//               next();
//             } else {
//               next(err);
//             }
//           }
//         );
//       }
//       res.setHeader('Content-Type', 'text/javascript');
//       // res.end('IS THIS THING ON???');
//       res.end(renderCache[req.url]);
//     });
//   };
// }
