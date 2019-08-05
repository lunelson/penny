const Compiler = require('./compile');
const configPostCSS = require('./config-postcss');
const { cssSrcExtRE } = require('./util-general');

module.exports = class CssCompiler extends Compiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    this.outExt = '.css';
    const { postcssInstance, postcssOptions } = configPostCSS(this);
    Object.assign(this, { postcssInstance, postcssOptions });
  }

  async render(src) {
    if (!src) src = await this.source();
    const { css } = await this.postcssInstance
      .process(src, this.postcssOptions)
      .catch(err => this.options.onCompile(err, this.srcFile));

    // NB: passing to super.render sets the outcache
    return super.render(css);
  }
};
