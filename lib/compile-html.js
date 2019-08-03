const grayMatter = require('gray-matter');

const Compiler = require('./compile');
const configPostHTML = require('./config-posthtml');
const { htmlSrcExtRE } = require('./util-general');

module.exports = class HtmlCompiler extends Compiler {
  constructor(srcFile, options) {
    const { outDir } = options;
    // set srcFile, outFile, depFiles
    super(srcFile, options);
    // reset outFile and route
    this.outFile = this.outFile.replace(htmlSrcExtRE, '.html');

    const { posthtmlInstance } = configPostHTML(this);
    Object.assign(this, { posthtmlInstance });
  }

  async source() {
    const src = await super.source();
    const { data, content } = grayMatter(src);
    const { reqFile } = this;
    this.$route = { ...data, reqFile };
    return content;
  }

  async render(src) {
    if (!src) src = await this.source();
    const { html } = await this.posthtmlInstance
      .process(src)
      .catch(err => this.options.onCompile(err, this.srcFile));

    // passing to super sets the outcache
    return super.render(html);
  }
};
