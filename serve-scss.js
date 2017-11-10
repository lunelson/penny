// ___  ___ ___ ___
// / __|/ __/ __/ __|
// \__ \ (__\__ \__ \
// |___/\___|___/___/

const fs = require('fs');
const path = require('path');
const { stat } = require('fs');
const { join, relative, resolve, extname, dirname } = require('path');
const { replaceExt, browsersList, sassUtils, cssErr } = require('./serve-utils');
const _ = require('lodash');

const Sass = require('node-sass');
const PostCSS = require('postcss')([require('autoprefixer')({ browsers: browsersList })]);

///
/// EXPORT
///

module.exports = function(baseDir, changeTimes) {
  const srcExt = '.scss';
  const renderCache = {};
  const renderTimes = {};

  return function(reqFile, res, next) {
    stat(reqFile, (err, stats) => {
      // bail, if reqFile actually exists
      if (!err && stats.isFile()) return next();
      const srcFile = replaceExt(reqFile, srcExt);
      stat(srcFile, (err, stats) => {
        // bail, if srcFile does not exist
        if (err || !stats.isFile()) return next();
        const now = Date.now();
        // if renderCache invalid, re-render and update renderTime
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
          const relFile = relative(baseDir, srcFile);
          const outFile = relFile.replace(/\.scss$/, '.css');
          renderCache[srcFile] = new Promise((resolve, reject) => {
            Sass.render(
              {
                file: relFile,
                outFile: outFile,
                includePaths: ['node_modules', '.', dirname(relFile)],
                outputStyle: 'nested',
                sourceMap: true, // TODO: only if in DEV mode
                functions: {
                  'require($path)': function(path) {
                    return sassUtils.toSass(require(sassUtils.sassString(path)));
                  },
                  'pow($x, $y)': function(x, y) {
                    return new Sass.types.Number(Math.pow(x.getValue(), y.getValue()));
                  }
                }
              },
              (err, data) => {
                if (err) reject(err);
                resolve(data);
              }
            );
          })
            .then(data => {
              renderTimes[srcFile] = now;
              // http://api.postcss.org/global.html#processOptions
              return PostCSS.process(data.css, {
                from: relFile,
                to: outFile,
                map: data.map ? { inline: true, prev: data.map.toString() } : false
              });
            })
            .catch(err => cssErr(err.formatted, 'yellow'));
        }

        // resolve renderCache, then serve
        renderCache[srcFile].then(data => {
          console.log(
            `${srcExt} file\n changed: ${changeTimes[srcExt]} \n rendered: ${
              renderTimes[srcFile]
            } \n served: ${now}`
          );
          res.setHeader('Content-Type', 'text/css');
          res.end(data.css);
        });
      });
    });
  };
};
