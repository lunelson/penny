const fs = require('fs');
const path = require('path');

const Compiler = require('./compile');
const configPostCSS = require('./config-postcss');
const { cssSrcExtRE } = require('./util-general');

module.exports = class CssCompiler extends Compiler {
  constructor(srcFile, options) {
    super(srcFile, options); // set srcFile, outFile, depFiles
    this.outFile = this.outFile.replace(cssSrcExtRE, '.css'); // enforce outFile .css ext
    this.PostCSS = configPostCSS(this);
  }

  async render(src) {
    if (!src) src = await this.source();
    const { css } = await this.PostCSS.process(src, {
      from: this.srcFile,
      to: this.outFile,
      map: this.options.isDev ? { inline: true } : false,
    }).catch(err => this.options.onCompile(err, this.srcFile));

    // NB: passing to super.render sets the outcache
    return super.render(css);
  }
};
