const toStream = require('to-readable-stream');

// local
const { scssLogger } = require('./loggers');
const { cssErr } = require('./errors');

// export
module.exports = function(srcDir, options) {
  const { isDev, browsers } = options;
  const sassOptions = {
    includePaths: ['node_modules', '.', dirname(file)],
    outputStyle: 'nested',
    sourceMap: isDev,
    functions: sassFns(srcFile),
  };
  const Post = PostCSS([
    autoPrefixer({ browsers })
  ].concat(isDev?[]:[postCSSClean({})]));

  return class ScssCompiler {
    constructor(srcFile) {
      this.srcFile = srcFile;
      this.depFiles = [];
    }
    check(absFile){ if (~this.depFiles.indexOf(absFile)) this.reset(); }
    reset() { delete this.outCache; }
    stream() {
      try {
        if (!('outCache' in this)) {
          const { srcFile } = this;
          const outFile = replaceExt(srcFile, '.css');
          const { css, map, stats } = Sass.renderSync({
            file: srcFile, outFile, ...sassOptions
          });
          this.depFiles = stats.includedFiles;
          this.outCache = Post.process(css, {
            from: srcFile, to: outFile,
            map: map ? { inline: true, prev: map.toString() } : false
          }).css;
        }
        return toStream(this.outCache);
      }
      catch(err) {
        if (!isDev) throw Error(err);
        scssLogger.error(err.formatted);
        return toStream(cssErr(err.formatted));
      }
    }
  };
};
