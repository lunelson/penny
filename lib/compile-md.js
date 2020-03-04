// node
const { relative } = require('path');
const { readFileSync } = require('fs');

// npm
const grayMatter = require('gray-matter');

// export
module.exports = function (srcDir, pubDir, options, depReporter) {

  const mdi = require('./config-markdown-it.js')(options);
  const PugCompiler = require('./compile-pug.js')(srcDir, pubDir, options, depReporter);

  return class MdCompiler extends PugCompiler {

    constructor(srcFile) {
      super(srcFile);
      this.route = '/' + relative(pubDir, srcFile).replace(/\.md$/, '.html');
    }

    source() {
      const {
        data,
        data: { layout, mixins }
      } = grayMatter(readFileSync(this.srcFile, 'utf8'));
      return {
        data,
        content: `extends ${layout}\nblock content\n  include:markdown(mixins='${mixins}') /${relative(srcDir, this.srcFile)}`
      };
    }
  };
};
