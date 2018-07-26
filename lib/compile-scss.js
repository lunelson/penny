const { resolve, dirname, join } = require('path');

const nodeSass = require('node-sass');
const postCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');
const toStream = require('to-readable-stream');

// local
const { sassLogger } = require('./loggers.js');
const { cssErr } = require('./errors.js');
const { replaceExt } = require('./misc-penny.js');
const sassFns = require('./functions-sass.js');

// export
module.exports = function(srcDir, options) {
  const { isDev, browsers } = options;
  const renderOptions = {
    includePaths: ['node_modules'],
    outputStyle: isDev?'nested':'compressed',
    sourceMap: isDev,
  };

  const post = postCSS([
    autoPrefixer({ browsers })
  ].concat(isDev?[]:[postCSSClean({})]));

  return class ScssCompiler {
    constructor(srcFile) {
      this.srcFile = srcFile;
      this.depFiles = [];
      this.funcs = sassFns(srcDir, srcFile);
    }
    check(absFile){ if (~this.depFiles.indexOf(absFile)) this.reset(); }
    reset() { delete this.outCache; }
    stream() {
      try {
        if (!('outCache' in this)) {
          const { srcFile, funcs } = this;
          const outFile = replaceExt(srcFile, '.css');
          const { css, map, stats } = nodeSass.renderSync({
            file: srcFile,
            functions: funcs.instance,
            outFile, ...renderOptions,
          });
          this.depFiles = [...stats.includedFiles, ...funcs.includedFiles];
          sassLogger.trace(`deps logged: ${this.depFiles}`);
          this.outCache = post.process(css, {
            from: srcFile, to: outFile,
            map: map ? { inline: true, prev: map.toString() } : false
          }).css;
        }
        return toStream(this.outCache);
      }
      catch(err) {
        if (!isDev) throw Error(err);
        sassLogger.error(err.formatted);
        return toStream(cssErr(err.formatted));
      }
    }
  };
};
