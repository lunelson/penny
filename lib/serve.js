'use-strict';

const debug = require('debug');
const { relative, extname } = require('path');
const { stat } = require('fs');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.scss': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.pug': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const renderCache = {};
const renderTimes = {};

function replaceExt(filepath, ext) {
  return filepath.trim().replace(new RegExp(`${extname(filepath)}$`), ext);
}

module.exports = function (srcExt, baseDir, isDev, changeTimes, options) {

  const renderFn = require(`./render-${srcExt.slice(1)}.js`)(baseDir, isDev, options);
  const loggerFn = debug(`penny:${srcExt.slice(1)}`);

  return function(reqFile, res, next) {

    // check for srcFile,
    const srcFile = replaceExt(reqFile, srcExt);
    stat(srcFile, (err, stats) => {

      // bail, if srcFile does not exist
      if (err || !stats.isFile()) return next();

      // set header
      res.setHeader('Content-Type', contentTypes[srcExt]);

      // if renderCache is invalid, re-render and update renderTime
      if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
        renderCache[srcFile] = renderFn(srcFile, renderTimes);
      }

      // resolve renderCache, then
      renderCache[srcFile].then(data => {

        // log change/render/serve stats
        loggerFn(`${relative(baseDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${renderTimes[srcFile]}\nserved: ${Date.now()}`);

        // serve data
        res.end(data);
      });
    });
  };
};
