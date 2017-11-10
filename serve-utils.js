//        _   _ _
//       | | (_) |
//  _   _| |_ _| |___
// | | | | __| | / __|
// | |_| | |_| | \__ \
//  \__,_|\__|_|_|___/

const { join, relative, resolve, extname } = require('path');
const { stat, readFile } = require('fs');

function replaceExt(filename, extension) {
  return filename.slice(0, 0 - extname(filename).length) + extension;
}

module.exports = { replaceExt };
