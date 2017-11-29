// ___  ___ ___ ___
// / __|/ __/ __/ __|
// \__ \ (__\__ \__ \
// |___/\___|___/___/

const fs = require('fs');
const path = require('path');
const { stat } = require('fs');
const { join, relative, resolve, extname, dirname } = require('path');
const { replaceExt } = require('./serve-utils');
const _ = require('lodash');
const debug = require('debug');

const Sass = require('node-sass');
const PostCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');
const logger = debug('penny:scss');

const { sassUtils } = require('./serve-scss-utils');
const { cssErr } = require('./serve-err');

///
/// EXPORT
///

module.exports = function(baseDir, isDev, changeTimes, options) {
  const srcExt = '.scss';
  const renderCache = {};
  const renderTimes = {};
  const prefix = autoPrefixer({ browsers: options.browsersList });
  const clean = postCSSClean({});
  const postCSS = PostCSS([prefix].concat(isDev?[]:[clean]));

  return function(reqFile, res, next) {
    stat(reqFile, (err, stats) => {
      // bail, if reqFile actually exists
      if (!err && stats.isFile()) return next();
      const srcFile = replaceExt(reqFile, srcExt);
      stat(srcFile, (err, stats) => {
        // bail, if srcFile does not exist
        if (err || !stats.isFile()) return next();
        const now = Date.now();
        res.setHeader('Content-Type', 'text/css; charset=utf-8');

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
                sourceMap: isDev,
                // sourceMapRoot: baseDir, // ??
                // data: `$E: ${Math.E}; $LN2: ${Math.LN2}; $LN10: ${Math.LN10}; $LOG2E: ${Math.LOG2E}; $LOG10E: ${Math.LOG10E}; $PI: ${Math.PI}; $SQRT1_2: ${Math.SQRT1_2}; $SQRT2: ${Math.SQRT2};`,
                functions: {
                  'require($path)': function(path) {
                    return sassUtils.toSass(require(sassUtils.sassString(path)));
                  },
                  'pow($x, $y)': function(x, y) {
                    return new Sass.types.Number(Math.pow(x.getValue(), y.getValue()));
                  },
                  'sqrt($x)': function(x) {
                    return new Sass.types.Number(Math.sqrt(x.getValue()));
                  },
                  'sign($x)': function(x) {
                    return new Sass.types.Number(Math.sign(x.getValue()));
                  },
                  'trunc($x)': function(x) {
                    return new Sass.types.Number(Math.trunc(x.getValue()));
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
            // TODO: replace this logic with bsync notify, or debug('penny')
            .catch(err => {
              logger(err);
              renderTimes[srcFile] = now;
              err.css = cssErr(err.formatted, '#F2E6EA');
              return err;
            });
        }

        // resolve renderCache, then serve
        renderCache[srcFile].then(data => {
          logger(
            `${relative(baseDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${
              renderTimes[srcFile]
            } \nserved: ${now}`
          );
          res.end(data.css);
        });
      });
    });
  };
};
