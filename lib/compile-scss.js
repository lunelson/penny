const CssCompiler = require('./compile-css');
const { Sass, SassOptions } = require('./config-scss');

module.exports = class ScssCompiler extends CssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    this.renderOptions = new SassOptions(this, options);
  }

  render() {
    const { css, map, stats } = Sass.renderSync({
      file: this.srcFile,
      outFile: this.outFile,
      ...this.renderOptions,
    });

    // update depFiles
    this.depFiles.length = 0;
    this.depFiles.push(...stats.includedFiles);
    // passing to super.render applies postCSS
    return super.render(css, map);
  }
};
