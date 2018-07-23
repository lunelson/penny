/*
  - is there a compiler destroy method
*/
const fs = require('fs');
const path = require('path');
const webpack = require('webpack'); // https://webpack.js.org/api/node/

const { webpackLogger } = require('./loggers.js');
const { memoryFs, bufferCache } = require('./caches.js');
const { Deferral } = require('./misc-penny.js');
const { watchOptions, errStatsHandler, configCreator } = require('./misc-webpack.js');

module.exports = function(srcDir, outDir=null, isDev=true) {

  const configureEntry = configCreator(srcDir, outDir, isDev);

  return {
    init(fileSet) { this.fileSet = fileSet; },
    start(){
      if (!(this.fileSet.length > 0)) return;
      webpackLogger.info('Starting Webpack MultiCompiler');
      this.multiCompiler = webpack([...this.fileSet].map(configureEntry));
      this.multiCompiler.outputFileSystem = isDev ? memoryFs : fs;
      this.multiCompiler.compilers[0].hooks.watchClose.tap('closing', compilation => {
        webpackLogger.info('Closing Webpack MultiCompiler')
      });
      if (isDev) {
        this.multiCompiler.compilers.forEach(compiler => {
          const srcFile = compiler.options.entry;
          compiler.hooks.watchRun.tap('running', compiler => {
            srcFile in bufferCache && delete bufferCache[srcFile];
            bufferCache[srcFile] = Deferral();
            webpackLogger.debug(`Running: ${srcFile}`)
          });
          compiler.hooks.afterEmit.tap('emitted', compilation => {
            bufferCache[srcFile].resolve(memoryFs.readFileSync(srcFile)); // creates Buffer
            webpackLogger.debug(`Emitted: ${srcFile}`);
          });
        });
      }
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
};
