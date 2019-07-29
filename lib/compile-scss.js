const _ = require('lodash');

const CssCompiler = require('./compile-css');
const configSass = require('./config-sass');

module.exports = class ScssCompiler extends CssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { sassEngine, sassOptions } = configSass(this);
    Object.assign(this, { sassEngine, sassOptions });
  }

  render() {
    let css;
    try {
      const result = this.sassEngine.renderSync(this.sassOptions);
      // update depFiles
      this.depFiles.length = 0;
      this.depFiles.push(...result.stats.includedFiles);
      // set css
      css = result.css;
    } catch (err) {
      this.options.onCompile(err, this.srcFile);
    }
    // NB: passing to super.render applies postCSS
    return super.render(css);
  }
};
