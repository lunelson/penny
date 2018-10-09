// node
const { readFileSync } = require('fs');

// npm
const _ = require('lodash');
const Pug = require('pug');
const grayMatter = require('gray-matter');
const toStream = require('to-readable-stream');

// local
const { pugLogger } = require('./loggers');

// export
module.exports = function(srcDir, pubDir, options, depReporter) {

  const { markdown } = require('./configure-markdown-it.js')(options);
  const PugCompiler = require('./compile-pug.js')(srcDir, pubDir, options);

  return class MdCompiler extends PugCompiler {
    constructor(srcFile) { super(srcFile); }
    stream() {
      try {
        if (!('template' in this)) {
          const { srcFile } = this;
          const { data, content } = grayMatter(readFileSync(srcFile, 'utf8'));
          const pugSrc = `extends ${data.layout}\nblock content\n  != '${markdown(content).replace(/\n/g,'')}'`;
          this.$page = data;
          this.template = Pug.compile(pugSrc, this.options);

          // only reset depFiles if compilation worked !!
          this.depFiles.length = 0;
          this.depFiles = [this.srcFile].concat(this.template.dependencies);
          depReporter(this.depFiles);
          pugLogger.debug(`depFiles added to watch: ${this.depFiles.length}`);
        }
        if (!('outCache' in this)) {
          const { $page, options, locals } = this;
          this.outCache = this.template(_.assign(locals, { $page, $options: options }));
        }
        return toStream(this.outCache);
      } catch(err) { this.error(err); }
    }
  };
};
