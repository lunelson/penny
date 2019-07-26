const fs = require('fs');
const path = require('path');

const Compiler = require('./compile');
const configPostHTML = require('./config-posthtml');
const { htmlSrcExtRE } = require('./util-general');

module.exports = class HtmlCompiler extends Compiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { pubDir, outDir } = options;
    // ? shouldn't outFile be relative to outDir
    this.outFile = srcFile.replace(htmlSrcExtRE, '.html');
    this.reqPath = '/' + path.relative(pubDir, this.outFile);
  }

  async render(src) {
    src = src || fs.readFileSync(this.srcFile, 'utf8');
    if (this.options.isDev) return super.render(src);
    const PostHTML = configPostHTML(this);
    const { html } = await PostHTML.process(src).catch(this.options.onCompile);
    // passing to super sets the outputCache
    return super.render(html);
  }
};
