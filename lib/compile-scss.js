const { resolve, dirname, join, relative } = require('path');

// npm
const nodeSass = require('node-sass');
const postCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');
const toStream = require('to-readable-stream');
var findup = require('findup-sync');

// local
const { sassLogger } = require('./loggers.js');
const { cssErr } = require('./errors.js');
const { replaceExt } = require('./misc-penny.js');
const sassFunctions = require('./functions-sass.js');
const SrcCompiler = require('./compile-src.js');

// export
module.exports = function(srcDir, pubDir, options, depReporter) {

  const { isDev, browsers } = options;

  const post = postCSS([ autoPrefixer({ browsers, grid: true }) ]);

  // requireResolve.sync(relFile.getValue(), { basedir: dirname(srcFile) });
  const renderOptions = {
    includePaths: [findup('node_modules', { cwd: srcDir }), srcDir],
    // includePaths: ['node_modules', relative(process.cwd(), srcDir)],
    outputStyle: isDev?'expanded':'compressed',
    sourceMap: isDev,
  };

  console.info(renderOptions.includePaths);

  const initFunctions = sassFunctions(srcDir, pubDir, options);

  return class ScssCompiler extends SrcCompiler {

    constructor(srcFile) {
      super(srcFile);
      this.functions = initFunctions(this.srcFile, this.depFiles);
    }

    reset() {
      sassLogger.debug('resetting compiler');
      delete this.outCache;
    }

    error(err) {
      if (!isDev) throw Error(err);
      sassLogger.error(err.formatted);
      return toStream(cssErr(err.formatted));
    }

    stream() {
      try {
        if (!('outCache' in this)) {
          const { srcFile, functions } = this;
          const outFile = replaceExt(srcFile, '.css');

          // nodeSass render
          const { css, map, stats } = nodeSass.renderSync({
            file: srcFile,
            functions, outFile,
            ...renderOptions,
          });

          // postCSS render
          this.outCache = post.process(css, {
            from: srcFile, to: outFile,
            map: map ? { inline: true, prev: map.toString() } : false
          }).css;

          // only reset depFiles if compilations worked!
          this.depFiles.length = 0;
          this.depFiles.push(...stats.includedFiles);
          depReporter(this.depFiles);
          sassLogger.debug(`depFiles added to watch: ${this.depFiles.length}`);
        }
        return toStream(this.outCache);
      } catch(err) { return this.error(err); }
    }
  };
};
