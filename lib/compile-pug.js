// node
const { relative, dirname } = require('path');
const { readFileSync } = require('fs');

// npm
const _ = require('lodash');
const Pug = require('pug');
const grayMatter = require('gray-matter');
const toStream = require('to-readable-stream');

// local
const { pugLogger } = require('./loggers');
const { htmlCssErr } = require('./errors');
const { initPugLocals, initPugOptions } = require('./misc-pug.js');
const initPugFunctions = require('./functions-pug.js');

// export
module.exports = function(srcDir, options) {

  const { isDev } = options;

  const pugOptions = initPugOptions(srcDir, options);
  const pugFunctions = initPugFunctions(srcDir, options);

  return class PugCompiler {
    constructor(srcFile) {
      this.srcFile = srcFile;
      this.depFiles = [];
      this.$options = pugOptions(srcFile); // includes filters
      this.functions = pugFunctions(srcDir, srcFile);
    }
    check(absFile){ if (~this.depFiles.indexOf(absFile)) this.reset(); }
    reset() { delete this.template; delete this.outCache; }
    stream() {
      try {
        if (!('template' in this)) {
          const { srcFile } = this;
          const { data, content } = grayMatter(readFileSync(srcFile, 'utf8'));
          const pathname = '/'+relative(srcDir, srcFile).replace(/\.pug$/, '.html');
          pugLogger.debug('re-compiling template');
          this.$page = Object.assign({ pathname }, data);
          this.template = Pug.compile(content, this.$options);
          this.depFiles = [this.srcFile].concat(this.template.dependencies);
          this.functions._depFiles.length = 0;
        }
        if (!('outCache' in this)) {
          const { $page, $options, functions } = this;
          pugLogger.debug('re-rendering outCache');
          this.outCache = this.template(_.assign(functions, { $page, $options }));
          this.depFiles.push(...functions._depFiles);
        }
        return toStream(this.outCache);
      } catch(err) {
        if (!isDev) throw Error(err);
        pugLogger.error(err);
        return toStream(htmlCssErr(err));
      }
    }
  };
};
