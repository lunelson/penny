const Sass = require('node-sass');

const CssCompiler = require('./compile-css');
const configureSass = require('./config-sass');

module.exports = class ScssCompiler extends CssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    this.sassConfig = configureSass(this);
    this.compileFn = configureSass(this);
  }

  render() {
    const { css, map, stats } = Sass.renderSync({
      file: this.srcFile,
      outFile: this.outFile,
      indentedSyntax: false,
      ...this.sassConfig,
    });

    // update depFiles
    this.depFiles.length = 0;
    this.depFiles.push(...stats.includedFiles);
    // passing to super.render applies postCSS
    return super.render(css, map);
  }
};
