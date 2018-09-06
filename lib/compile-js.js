/*
  - is there a compiler destroy method ??
*/
// const fs = require('fs');
// const path = require('path');
const webpack = require('webpack'); // https://webpack.js.org/api/node/
// const MemoryFS = require('memory-fs'); // https://github.com/webpack/memory-fs

const { webpackLogger } = require('./loggers.js');
// const { memoryFs, bufferCache } = require('./caches.js');
const { watchOptions, errStatsHandler, configCreator } = require('./misc-webpack.js');
const { Deferral } = require('./misc-penny.js');

const memoryFs = new (require('memory-fs'))(); // https://github.com/webpack/memory-fs
const bufferCache = Object.create(null);

function jsCompilerMaker(srcDir, pubDir, options) {

  const configureEntry = configCreator(srcDir, pubDir, options);

  return {
    init(fileSet) {
      this.fileSet = fileSet;
      this.ready = Deferral();
    },

    start(){
      // bail if no files
      if (!(this.fileSet.size > 0)) return;

      webpackLogger.info('Starting Webpack MultiCompiler');
      this.multiCompiler = webpack([...this.fileSet].map(configureEntry));
      this.multiCompiler.outputFileSystem = memoryFs;
      this.multiCompiler.compilers[0].hooks.watchClose.tap('closing', compilation => {
        webpackLogger.info('Closing Webpack MultiCompiler');
      });

      this.multiCompiler.compilers.forEach(compiler => {
        const srcFile = compiler.options.entry;
        compiler.hooks.watchRun.tap('running', compiler => {
          this.ready.resolve();
          srcFile in bufferCache && delete bufferCache[srcFile];
          bufferCache[srcFile] = Deferral();
          webpackLogger.debug(`run: ${srcFile}`);
        });
        compiler.hooks.afterEmit.tap('emitted', compilation => {
          bufferCache[srcFile].resolve(memoryFs.readFileSync(srcFile));
          webpackLogger.debug(`emit: ${srcFile}`);
        });
      });
      this.watching = this.multiCompiler.watch(watchOptions, errStatsHandler);
    },
    restart() {
      this.watching.close(() => {
        delete this.multiCompiler;
        delete this.watching;
        this.start();
      });
    }
  };
}

module.exports = {
  memoryFs,
  bufferCache,
  jsCompilerMaker
};
