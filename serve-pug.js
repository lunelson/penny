//  _ __  _   _  __ _
// | '_ \| | | |/ _` |
// | |_) | |_| | (_| |
// | .__/ \__,_|\__, |
// | |           __/ |
// |_|          |___/

const { join, relative, resolve, extname } = require('path');
const { stat } = require('fs');
const { replaceExt } = require('./serve-utils');
const Pug = require('pug');

/*
  TODO
  - add utilities to pug locals
  - add pug-error rendering to HTML
*/

///
/// SRCWARE
///

module.exports = function(baseDir, changeTimes) {
  const renderCache = {};
  const renderTimes = {};
  const srcExt = '.pug';
  const locals = {};
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
          renderCache[srcFile] = Pug.renderFile(
            srcFile,
            Object.assign({}, locals, {
              cache: false,
              pretty: true,
              basedir: baseDir,
              pathname: relative(baseDir, srcFile)
            })
          );
          renderTimes[srcFile] = now;
        }
        console.log(
          `${srcExt} file\n changed: ${changeTimes['.pug']} \n rendered: ${
            renderTimes[srcFile]
          } \n served: ${now}`
        );
        res.setHeader('Content-Type', 'text/html');
        res.end(renderCache[srcFile]);
      });
    });
  };
};
