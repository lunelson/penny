const CssCompiler = require('./compile-css');
const configSass = require('./config-sass');

module.exports = class ScssCompiler extends CssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { sassEngine, sassOptions } = configSass(this);
    Object.assign(this, { sassEngine, sassOptions });
  }

  render() {
    const { css, map, stats } = this.sassEngine.renderSync(this.sassOptions);

    // update depFiles
    this.depFiles.length = 0;
    this.depFiles.push(...stats.includedFiles);

    // passing to super.render applies postCSS
    return super.render(css, map);
  }
};
