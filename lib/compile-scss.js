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
const sassFunctions = require('./functions-sass.js');

// export
module.exports = function(srcDir, options) {

  const { isDev, browsers } = options;

  const renderOptions = {
    includePaths: ['node_modules'],
    outputStyle: isDev?'nested':'compressed',
    sourceMap: isDev,
  };

  const post = postCSS([
    autoPrefixer({ browsers, grid: true })
  ].concat(isDev?[]:[postCSSClean({})]));

  const setFunctions = sassFunctions(srcDir, options);

  return class ScssCompiler {
    constructor(srcFile) {
      this.srcFile = srcFile;
      this.depFiles = [];
      this.functions = setFunctions(this.srcFile, this.depFiles);
    }
    check(absFile){ if (~this.depFiles.indexOf(absFile)) this.reset(); }
    reset() { delete this.outCache; }
    stream() {
      try {
        if (!('outCache' in this)) {
          const { srcFile, functions } = this;
          const outFile = replaceExt(srcFile, '.css');
          this.depFiles.length = 0;
          const { css, map, stats } = nodeSass.renderSync({
            file: srcFile,
            functions, outFile,
            ...renderOptions,
          });
          this.depFiles.push(...stats.includedFiles);
          sassLogger.debug(`depFiles logged: ${this.depFiles}`);
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
