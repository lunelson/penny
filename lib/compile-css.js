const fs = require('fs');
const path = require('path');

const Compiler = require('./compile');
const configPostCSS = require('./config-postcss');
const { cssSrcExtRE } = require('./util-general');

module.exports = class CssCompiler extends Compiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { pubDir, outDir } = options;
    // ? shouldn't outFile be relative to outDir
    // if isDev, outDir = srcDir
    this.outFile = srcFile.replace(cssSrcExtRE, '.css');
    this.reqPath = '/' + path.relative(pubDir, this.outFile);
  }

  async render(src, map) {
    src = src || fs.readFileSync(this.srcFile, 'utf8');
    const PostCSS = configPostCSS(this);
    const { css } = await PostCSS.process(src, {
      from: this.srcFile,
      to: this.outFile,
      map: this.options.isDev
        ? { inline: true, prev: map ? map.toString() : false }
        : false,
    }).catch(err => {
      this.options.onCompile(err, this.srcFile);
    });
    // passing to super sets the outputCache
    return super.render(css);
  }
};
