const { join, relative, resolve, extname } = require('path');
const { stat } = require('fs');

module.exports = function (changeTimes) {
  const renderCache = {};
  const renderTimes = {};
  return function (relFile, baseDir, res, next) {
    const absFile = join(baseDir, relFile);
    stat(absFile, (err, stats) => {
      if (err || !stats.isFile()) return next();
      const ext = extname(relFile);
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
