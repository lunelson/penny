const { join, relative, resolve, extname } = require('path');
const { stat } = require('fs');

module.exports = function(baseDir, changeTimes) {
  const renderCache = {};
  const renderTimes = {};
  return function(absFile, res, next) {
    stat(absFile, (err, stats) => {
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
  };
};