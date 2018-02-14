const fs = require('fs');
const path = require('path');

// signature (srcFile, isDev, renderTimes);
const render = require('./render-scss');

module.exports = function(baseDir, destDir, options) {
  return function(srcFile) {
    const outDir = ''; // path in destDir rel to srcFile path in baseDir
    RENDER(srcFile, false, null).then((data) => {
      fs.writeFileSync(outFile, data);
    });
  }
}
