const ScssCompiler = require('./compile-scss');

module.exports = class SassCompiler extends ScssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    this.sassOptions.indentedSyntax = true; // this is the only difference
  }
};
