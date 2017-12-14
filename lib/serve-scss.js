//  ___  ___ _ ____   _____ ______ ___  ___ ___ ___
// / __|/ _ \ '__\ \ / / _ \______/ __|/ __/ __/ __|
// \__ \  __/ |   \ V /  __/      \__ \ (__\__ \__ \
// |___/\___|_|    \_/ \___|      |___/\___|___/___/

// node
const { stat } = require('fs');
const { relative } = require('path');

// local
const { replaceExt } = require('./utils');
const { scssLogger } = require('./loggers');

// export
module.exports = function(baseDir, isDev, changeTimes, options) {
  const srcExt = '.scss';
  const renderCache = {};
  const renderTimes = {};
  const renderFn = require(`./render-${srcExt.slice(1)}.js`)(baseDir, isDev, options);
  // const loggerFn = require('./loggers')(srcExt);

  return function(reqFile, res, next) {
    stat(reqFile, (err, stats) => {

      // bail, if reqFile exists
      if (!err && stats.isFile()) return next();

      // check for srcFile,
      const srcFile = replaceExt(reqFile, srcExt);
      stat(srcFile, (err, stats) => {

        // bail, if srcFile does not exist
        if (err || !stats.isFile()) return next();

        // set header
        res.setHeader('Content-Type', 'text/css; charset=utf-8');

        // if renderCache is invalid, re-render and update renderTime
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
          renderCache[srcFile] = renderFn(srcFile, renderTimes);
        }

        // resolve renderCache, then
        renderCache[srcFile].then(data => {

          // log change/render/serve stats
          scssLogger(
            `${relative(baseDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${
              renderTimes[srcFile]
            } \nserved: ${Date.now()}`
          );

          // serve data
          res.end(data);
        });
      });
    });
  };
};
