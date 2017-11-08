const { join, relative, resolve, extname } = require('path');
const { stat } = require('fs');

///
/// SUBWARE
///

module.exports = function(baseDir, changeTimes) {
  const renderCache = {};
  const renderTimes = {};
  return function(absFile, res, next) {
    stat(absFile, (err, stats) => {
      // if requested file exists, bail out
      // otherwise replace the extension and query that
      if (err || !stats.isFile()) return next();
      const ext = extname(absFile);
      const now = Date.now();
      if (
        !(absFile in renderCache) ||
        renderTimes[absFile] < changeTimes[ext]
      ) {
        // process this shit
      }
    });
    console.log(`${ext} file -- \n changed: ${changeTimes[ext]} \n rendered: ${renderTimes[absFile]} \n served: ${now}`);
    res.setHeader('Content-Type', 'text/javascript');
    res.end(renderCache[absFile]);
  };
};

//   _
//   (_)
//    _ ___
//   | / __|
//   | \__ \
//   | |___/
//  _/ |
// |__/

const Rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonJS = require('rollup-plugin-commonjs');

function jsWare(changeTimes) {
  const ext = '.js',
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

  return function (req, res, next) {
    const filename = join(__dirname, req.url);
    fs.stat(filename, (err, stats) => {
      if (!stats.isFile()) return next();
      // const now = Date.now();
      if (renderTime < changeTimes[ext]) {
        Rollup.rollup(Object.assign({}, config, { input: filename, cache: bundleCache[req.url] }))
          .then((bundle) => {
            bundleCache[req.url] = bundle;
            renderCache[req.url] = bundle.generate({
              format: 'es',
              sourcemap: 'inline'
            }).code;
            renderTime = Date.now();
          }, (err) => {
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
          });
      }
      res.setHeader('Content-Type', 'text/javascript');
      // res.end('IS THIS THING ON???');
      res.end(renderCache[req.url]);
    });
  };
}
