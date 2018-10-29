const { pennyLogger } = require('./loggers.js');

module.exports = class SrcCompiler {
  constructor(srcFile, depReporter) {
    this.srcFile = srcFile;
    this.depFiles = [srcFile];
    // this.depReporter = depReporter;
  }

  check(depFile) {
    if (!~this.depFiles.indexOf(depFile)) return false;
    pennyLogger.debug(`found dependency: ${depFile}`);
    this.reset();
    return true;
  }

  // report() {
  //   this.depReporter(this.depFiles);
  // }
};
