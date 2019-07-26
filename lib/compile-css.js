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
    const PostCSS = configPostCSS(this.options);
    const { css } = await PostCSS.process(src, {
      from: this.srcFile,
      to: this.outFile,
      map: map != undefined ? { inline: true, prev: map.toString() } : false,
    }).catch(this.options.onCompile);
    // passing to super sets the outputCache
    return super.render(css);
  }
};
