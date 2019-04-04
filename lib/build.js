const { relative } = require('path');
const { pennyLogger } = require('./util-loggers.js');

module.exports = function(options) {
  const { srcDir, pubDir, outDir } = options;
  pennyLogger.info(`building from {magenta:@/${relative(process.cwd(), pubDir)}} to {magenta:@/${relative(process.cwd(), outDir)}}\n`);
};
