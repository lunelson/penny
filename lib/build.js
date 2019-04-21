const { relative } = require('path');

const { pennyLogger } = require('./util-loggers.js');

module.exports = function(options) {
  const { srcDir, pubDir, outDir } = options;

  function shutdown() {
    process.exitCode = 1;
  }

  options.onParse = function onParse(err) {
    if (err) shutdown();
  };

  options.onCompile = function onCompile(err) {
    if (err) shutdown();
  };

  pennyLogger.info(
    `building from {magenta:@/${relative(process.cwd(), pubDir)}} to {magenta:@/${relative(process.cwd(), outDir)}}\n`,
  );
};
