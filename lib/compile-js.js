/*
  - is there a compiler destroy method
*/
const fs = require('fs');
const path = require('path');
const webpack = require('webpack'); // https://webpack.js.org/api/node/

const { webpackLogger } = require('./logger.js');
const { memoryFs, outFileCache } = require('./cache.js');
const { Deferral } = require('./misc-penny.js');
const { watchOptions, errStatsHandler, configCreator } = require('./misc-webpack.js');

module.exports = function(srcDir, outDir=null, isDev=true) {

  const configureEntry = configCreator(srcDir, outDir, isDev);

  return {
    init(fileSet) { this.fileSet = fileSet; },
    start(){
      webpackLogger.info('starting webpack MultiCompiler');
      this.multiCompiler = webpack([...this.fileSet].map(configureEntry));
      this.multiCompiler.outputFileSystem = isDev ? memoryFs : fs;
      this.multiCompiler.compilers[0].hooks.watchClose.tap('closing', compilation => {
        webpackLogger.info('closing webpack MultiCompiler')
      });
      if (isDev) {
        this.multiCompiler.compilers.forEach(compiler => {
          const srcFile = compiler.options.entry;
          compiler.hooks.watchRun.tap('running', compiler => {
            srcFile in outFileCache && delete outFileCache[srcFile];
            outFileCache[srcFile] = Deferral();
            webpackLogger.debug(`running: ${srcFile}`)
          });
          compiler.hooks.afterEmit.tap('emitted', compilation => {
            outFileCache[srcFile].resolve(memoryFs.readFileSync(srcFile)); // creates Buffer
            webpackLogger.debug(`emitted: ${srcFile}`);
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
      })
    }
  }
}
