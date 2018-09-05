const { readFileSync } = require('fs');

// npm
const postCSS = require('postcss');
const autoPrefixer = require('autoprefixer');
const toStream = require('to-readable-stream');

// local
const { pennyLogger } = require('./loggers.js');
const { cssErr } = require('./errors.js');
const { replaceExt } = require('./misc-penny.js');
const SrcCompiler = require('./compile-src.js');

// export
module.exports = function(srcDir, pubDir, options) {

  const { isDev, browsers } = options;

  return class CssCompiler extends SrcCompiler {

    constructor(srcFile) {
      super(srcFile);
      this.outFile = replaceExt(srcFile, '.css');
      this.depFiles = [srcFile];
      this.post = postCSS([ autoPrefixer({ browsers, grid: true }) ]);
      this.logger = pennyLogger;
    }

    reset() {
      this.logger.debug('resetting compiler');
      delete this.outCache;
    }

    error(err) {
      if (!isDev) throw Error(err);
      this.logger.error(err.formatted);
      return toStream(cssErr(err.formatted));
    }

    stream() {
      try {
        if (!('outCache' in this)) {
          const { srcFile, outFile } = this;
          // postCSS render
          this.outCache = this.post.process(readFileSync(srcFile, 'utf8'), {
            from: srcFile, to: outFile,
            map: false
          }).css;
        }
        return toStream(this.outCache);
      } catch(err) { return this.error(err); }
    }
  };
};
