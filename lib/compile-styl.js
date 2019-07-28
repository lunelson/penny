const Stylus = require('stylus');

const CssCompiler = require('./compile-css');
const configStylus = require('./config-stylus');

module.exports = class StylCompiler extends CssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { stylConfig } = configStylus(this);
    Object.assign(this, { stylConfig });
  }

  async render() {
    let css;
    try {
      const src = await this.source();
      const compiled = Stylus(src).use(this.stylConfig);
      // update depFiles
      this.depFiles.length = 0;
      this.depFiles.push(...compiled.deps());
      // set css
      css = compiled.render();
    } catch (err) {
      this.options.onCompile(err, this.srcFile);
    }
    // NB: passing to super.render applies postCSS
    return super.render(css);
  }
};
