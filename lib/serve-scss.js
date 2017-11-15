// ___  ___ ___ ___
// / __|/ __/ __/ __|
// \__ \ (__\__ \__ \
// |___/\___|___/___/

const fs = require('fs');
const path = require('path');
const { stat } = require('fs');
const { join, relative, resolve, extname, dirname } = require('path');
const { replaceExt, sassUtils, cssErr } = require('./serve-utils');
const _ = require('lodash');
const debug = require('debug');

const Sass = require('node-sass');
const PostCSS = require('postcss');
const autoPrefixer = require('autoprefixer');
const logger = debug('penguin:scss');

///
/// EXPORT
///

module.exports = function(baseDir, isDev, changeTimes, options) {
  const srcExt = '.scss';
  const renderCache = {};
  const renderTimes = {};
  const postCSS = PostCSS([autoPrefixer({ browsers: options.browsersList })]);

  return function(reqFile, res, next) {
    stat(reqFile, (err, stats) => {
      // bail, if reqFile actually exists
      if (!err && stats.isFile()) return next();
      const srcFile = replaceExt(reqFile, srcExt);
      stat(srcFile, (err, stats) => {
        // bail, if srcFile does not exist
        if (err || !stats.isFile()) return next();
        const now = Date.now();
        res.setHeader('Content-Type', 'text/css');

        // if renderCache invalid, re-render and update renderTime
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
          const procDir = process.cwd();
          const relFile = relative(procDir, srcFile);
          // const relFile = srcFile;
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
              // http://api.postcss.org/global.html#processOptions
              renderTimes[srcFile] = now;
              return postCSS.process(data.css, {
                from: relFile,
                to: outFile,
                map: data.map ? { inline: true, prev: data.map.toString() } : false
              });
            })
            // TODO: replace this logic with bsync notify, or debug('penguin')
            .catch(err => {
              logger(err);
              renderTimes[srcFile] = now;
              return err;
            });
        }

        // resolve renderCache, then serve
        renderCache[srcFile].then(data => {
          logger(
            `${srcExt} file\nchanged: ${changeTimes[srcExt]} \nrendered: ${
              renderTimes[srcFile]
            } \nserved: ${now}`
          );
          res.end(data.formatted || data.css);
          // cssErr(err.formatted, 'yellow')
        });
      });
    });
  };
};
