// const fs = require('fs');
const path = require('path');

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
    // this.route = '/' + path.relative(outDir, this.outFile);
    this.PostHTML = configPostHTML(this);
  }

  async source() {
    const src = await super.source();
    const { data, content } = grayMatter(src);
    const { reqFile } = this;
    this.route = { ...data, reqFile };
    return content;
  }

  async render(src) {
    if (!src) src = await this.source();
    // if (this.options.isDev) return super.render(src);
    const { html } = await this.PostHTML.process(src).catch(err =>
      this.options.onCompile(err, this.srcFile),
    );
    // passing to super sets the outcache
    return super.render(html);
  }
};
