const grayMatter = require('gray-matter');

const Compiler = require('./compile');
const configPostHTML = require('./config-posthtml');
const { htmlSrcExtRE } = require('./util-general');

module.exports = class HtmlCompiler extends Compiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    this.outExt = '.html';
    this.$page = {};
    const { posthtmlInstance } = configPostHTML(this);
    Object.assign(this, { posthtmlInstance });
  }

  async source() {
    const src = await super.source();
    const { data, content } = grayMatter(src);
    const { reqFile } = this;
    this.$page = { ...data, reqFile };
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