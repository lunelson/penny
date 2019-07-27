const fs = require('fs');
const path = require('path');

const Compiler = require('./compile');
const configPostCSS = require('./config-postcss');
const { cssSrcExtRE } = require('./util-general');

module.exports = class CssCompiler extends Compiler {
  constructor(srcFile, options) {
    const { outDir } = options;
    // set srcFile, outFile, depFiles
    super(srcFile, options);
    // reset outFile and route
    this.outFile = this.outFile.replace(cssSrcExtRE, '.css');
    // this.route = '/' + path.relative(outDir, this.outFile);
    this.PostCSS = configPostCSS(this);
  }

  async render(src, map) {
    if (!src) src = await this.source();
    const { css } = await this.PostCSS.process(src, {
      from: this.srcFile,
      to: this.outFile,
      map: this.options.isDev
        ? { inline: true, prev: map ? map.toString() : false }
        : false,
    }).catch(err => this.options.onCompile(err, this.srcFile));
    // passing to super sets the outcache
    return super.render(css);
  }
};
