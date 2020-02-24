// const fs = require('fs');
const fsP = require('fs').promises;
const path = require('path');

// const toStream = require('to-readable-stream');
// const readFile = require('fs-readfile-promise');

// const { pennyLogger } = require('./util-loggers.js');

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
    this.options = options;
    this.srcFile = srcFile;
    this.outExt = this.srcExt;
    this.depFiles = [];
  }

  get srcExt() {
    return path.extname(this.srcFile);
  }

  get outFile() {
    const { pubDir, srcDir, outDir } = this.options;
    return path
      .join(outDir || srcDir, path.relative(pubDir, this.srcFile))
      .replace(new RegExp(`${this.srcExt}$`), this.outExt);
  }

  get reqFile() {
    const { srcDir, outDir } = this.options;
    return '/' + path.relative(outDir || srcDir, this.outFile);
  }

  check(depFile) {
    return depFile == this.srcFile || ~this.depFiles.indexOf(depFile);
  }

  reset() {
    delete this.outcache;
    delete this.template;
  }

  clear() {
    delete this.outcache;
  }

  source() {
    return fsP.readFile(this.srcFile, 'utf8');
  }

  async render(src) {
    if (!src) src = await this.source();
    return (this.outcache = src);
  }

  output() {
    return this.outcache || this.render();
  }

  formatErr(error) {
    return error;
  }
};
