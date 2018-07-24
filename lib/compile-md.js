// node
const { relative } = require('path');
const { readFileSync } = require('fs');

// npm
const _ = require('lodash');
const Pug = require('pug');
const grayMatter = require('gray-matter');
const toStream = require('to-readable-stream');

// local
const { pugLogger } = require('./loggers');
const { htmlCssErr } = require('./errors');
const { $data, $pages } = require('./caches.js');
const { initPugLocals, initPugOptions } = require('./misc-pug.js');
const { replaceExt } = require('./misc-penny.js');
const { markdown } = require('./misc-mdi.js');

// export
module.exports = function(srcDir, options) {

  const { isDev } = options;

  const pugOptions = initPugOptions(srcDir, isDev);
  const pugLocals = initPugLocals(srcDir, isDev);

  return class MdCompiler {
    constructor(srcFile) {
      this.srcFile = srcFile;
      this.depFiles = [];
      this.$options = new pugOptions(replaceExt(srcFile, '.pug')); // includes filters
      this.locals = new pugLocals(replaceExt(srcFile, '.pug'));
    }
    check(absFile){ if (~this.depFiles.indexOf(absFile)) this.reset(); }
    reset() { delete this.template; delete this.outCache; }
    stream() {
      const { srcFile } = this;
      try {
        if (!('template' in this)) {
          const { data, content } = grayMatter(readFileSync(srcFile, 'utf8'));
          // const pugSrc = `extends ${data.layout}\nblock content\n  include:markdown /${relative(srcDir, this.srcFile)}`;
          const pugSrc = `extends ${data.layout}\nblock content\n  != '${markdown(content).replace(/\n/g,'')}'`;
          this.$page = data;
          this.template = Pug.compile(pugSrc, this.$options);
          this.depFiles = [this.srcFile].concat(this.template.dependencies);
        }
        if (!('outCache' in this)) {
          const { $page, $options, locals } = this;
          this.outCache = this.template(_.assign(locals, { $data, $pages, $page, $options }));
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
