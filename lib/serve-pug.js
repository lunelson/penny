//  ___  ___ _ ____   _____ ______ _ __  _   _  __ _
// / __|/ _ \ '__\ \ / / _ \______| '_ \| | | |/ _` |
// \__ \  __/ |   \ V /  __/      | |_) | |_| | (_| |
// |___/\___|_|    \_/ \___|      | .__/ \__,_|\__, |
//                                | |           __/ |
//                                |_|          |___/

// node
const { stat } = require('fs');
const { relative, dirname } = require('path');

// npm
const Pug = require('pug');

// local
const { pugLogger } = require('./loggers');
const { htmlCssErr } = require('./errors');
const { replaceExt } = require('./utils');
const { pugLocals } = require('./utils-pug');

// export
module.exports = function (baseDir, isDev, changeTimes, options) {
  const srcExt = '.pug';
  const renderCache = {};
  const renderTimes = {};
  const renderFn = require(`./render-${srcExt.slice(1)}.js`)(baseDir, isDev, options);

  return function (reqFile, res, next) {
    stat(reqFile, (err, stats) => {

      // bail, if reqFile exists
      if (!err && stats.isFile()) return next();

      // check for srcFile
      const srcFile = replaceExt(reqFile, srcExt);
      stat(srcFile, (err, stats) => {

        // bail, if srcFile does not exist
        if (err || !stats.isFile()) return next();
        const now = Date.now();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');

        // if renderCache invalid, re-render and update renderTime
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
          renderCache[srcFile] = new Promise((resolve, reject) => {
            Pug.renderFile(
              srcFile,
              Object.assign({}, pugLocals, {
                pretty: isDev,
                basedir: baseDir,
                dirname: dirname(srcFile),
                relFilename: relative(baseDir, srcFile),
                pathname: `/${relative(baseDir, srcFile).replace(/\.pug$/, '.html')}`
              }),
              function(err, data) {
                renderTimes[srcFile] = now;
                if (err != null) return reject(err);
                return resolve(data);
              }
            );
          });
        }
        // resolve renderCache, then
        renderCache[srcFile].then(data => {

          // log the change/render/serve stats
          pugLogger(
            `${relative(baseDir, srcFile)}\n changed: ${changeTimes[srcExt]} \n rendered: ${
              renderTimes[srcFile]
            } \n served: ${now}`
          );

          // serve the data
          res.end(data);
        }).catch(err => {
          res.end(htmlCssErr(err.toString(), '#F2EEE6', 'pug'));
        });
      });
    });
  };
};
