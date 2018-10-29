// node
const {
  relative,
  dirname
} = require('path');
const {
  readFileSync
} = require('fs');

// npm
const _ = require('lodash');
const Pug = require('pug');
const grayMatter = require('gray-matter');
const toStream = require('to-readable-stream');

// local
const {
  pugLogger
} = require('./loggers');

// export
module.exports = function (srcDir, pubDir, options, depReporter) {

  const mdi = require('./config-markdown-it.js')(options);
  const PugCompiler = require('./compile-pug.js')(srcDir, pubDir, options, depReporter);

  return class MdCompiler extends PugCompiler {

    constructor(srcFile) {
      super(srcFile);
      this.pathname = '/' + relative(pubDir, srcFile).replace(/\.md$/, '.html');
    }

    source() {
      const {
        data,
        content
      } = grayMatter(readFileSync(this.srcFile, 'utf8'));
      return {
        data,
        content: `extends ${data.layout}\nblock content\n  != '${mdi.render(content).replace(/\n/g,'')}'`
      };
    }

    // stream() {
    //   try {
    //     if (!('template' in this)) {
    //       const { srcFile, pathname } = this;
    //       this.$page = Object.assign({ pathname }, data);
    //       this.template = Pug.compile(pugSrc, this.options);

    //       // only reset depFiles if compilation worked !!
    //       this.depFiles.length = 0;
    //       this.depFiles = [this.srcFile].concat(this.template.dependencies);
    //       depReporter(this.depFiles);
    //       pugLogger.debug(`depFiles added to watch: ${this.depFiles.length}`);
    //     }
    //     if (!('outCache' in this)) {
    //       const { $page, options, locals } = this;
    //       this.outCache = this.template(_.assign(locals, { $page, $options: options }));
    //     }
    //     return toStream(this.outCache);
    //   } catch(err) { this.error(err); }
    // }
  };
};
