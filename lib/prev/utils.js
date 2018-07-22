//        _   _ _
//       | | (_) |
//  _   _| |_ _| |___
// | | | | __| | / __|
// | |_| | |_| | \__ \
//  \__,_|\__|_|_|___/

const { /* join, relative, resolve, */ extname } = require('path');
// const { stat, readFile } = require('fs');

const _ = require('lodash');

const merge = Object.assign.bind(Object, Object.create(null));

function replaceExt(filename, extension) {
  return filename.slice(0, 0 - extname(filename).length) + extension;
}


class PrepCache {
  constructor(prepFn) {
    this.prepFn = prepFn;
    this.cache = Object.create(null);
  }
  get(id, ...rest) {
    if (!(id in this.cache)) this.cache[id] = this.prepFn(id, ...rest);
    return this.cache[id];
  }
}
module.exports = {
  PrepCache,
  replaceExt,
  merge
};
