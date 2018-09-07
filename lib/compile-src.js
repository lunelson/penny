const { pennyLogger } = require('./loggers.js');

module.exports = class SrcCompiler {
  constructor(srcFile) {
    this.srcFile = srcFile;
    this.depFiles = [srcFile];
  }
  check(depFile) {
    if (!~this.depFiles.indexOf(depFile)) return false;
    pennyLogger.debug(`found dependency: ${depFile}`);
    this.reset();
    return true;
  }
};
