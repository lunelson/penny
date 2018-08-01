const { pennyLogger } = require('./loggers.js');

module.exports = class SrcCompiler {
  constructor() {
    this.depFiles = [];
  }
  check(absFile) {
    if (!~this.depFiles.indexOf(absFile)) return false;
    pennyLogger.debug(`found depFile: ${absFile}`);
    this.reset(); return true;
  }
  reset() {
    pennyLogger.debug('resetting depFiles');
    this.depFiles.length = 0;
  }
};
