//  _ __  _   _  __ _
// | '_ \| | | |/ _` |
// | |_) | |_| | (_| |
// | .__/ \__,_|\__, |
// | |           __/ |
// |_|          |___/

const { /* join, */ relative /* resolve, extname */ } = require('path');
const { stat } = require('fs');
const { replaceExt } = require('./serve-utils');
const debug = require('debug');

/*
TODO
- add utilities to pug locals
- add pug-error rendering to HTML
*/

const Pug = require('pug');
// TODO: add more requirements for pug locals here
const logger = debug('penguin:pug');
const locals = { cache: false, doctype: 'html' };

///
/// EXPORT
///

module.exports = function (baseDir, isDev, changeTimes, options) {
  const srcExt = '.pug';
  const renderCache = {};
  const renderTimes = {};

  return function (reqFile, res, next) {
    stat(reqFile, (err, stats) => {
      // bail, if reqFile actually exists
      if (!err && stats.isFile()) return next();
      const srcFile = replaceExt(reqFile, srcExt);
      stat(srcFile, (err, stats) => {
        // bail, if srcFile does not exist
        if (err || !stats.isFile()) return next();
        const now = Date.now();
        res.setHeader('Content-Type', 'text/html');

        // if renderCache invalid, re-render and update renderTime
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
          // TODO: error display on screen or using bsync.notify()
          renderCache[srcFile] = Pug.renderFile(
            srcFile,
            Object.assign({}, locals, {
              pretty: true, // TODO: dev dependent
              basedir: baseDir,
              pathname: relative(baseDir, srcFile)
            })
          );
          renderTimes[srcFile] = now;
        }
        logger(
          `${srcExt} file\n changed: ${changeTimes[srcExt]} \n rendered: ${
            renderTimes[srcFile]
          } \n served: ${now}`
        );
        res.end(renderCache[srcFile]);
      });
    });
  };
};