const fs = require('fs');
const path = require('path');

const toStream = require('to-readable-stream');
const readFile = require('fs-readfile-promise');

const { pennyLogger } = require('./util-loggers.js');

// pennyLogger.debug(
//   `${path.relative(
//     this.options.srcDir,
//     this.srcFile,
//   )} matches or depends upon: ${path.relative(
//     this.options.srcDir,
//     depFile,
//   )}`,
// );

module.exports = class Compiler {
  constructor(srcFile, options) {
    const { pubDir, outDir } = options;
    this.options = options;
    this.srcFile = srcFile;
    this.outFile = path.join(outDir, path.relative(pubDir, srcFile));
    this.depFiles = [];
    this.route = {};
  }

  get reqFile() {
    return '/' + path.relative(this.options.outDir, this.outFile);
  }

  check(depFile) {
    if (!(depFile == this.srcFile || ~this.depFiles.indexOf(depFile)))
      return false;
    this.reset();
    return true;
  }

  reset() {
    delete this.outcache;
    delete this.template;
  }

  clear() {
    delete this.outcache;
  }

  source() {
    return readFile(this.srcFile, 'utf8');
  }

  async render(src) {
    if (!src) src = await this.source();
    return (this.outcache = src);
  }

  output() {
    return this.outcache || this.render();
  }
};
