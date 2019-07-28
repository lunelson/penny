const ScssCompiler = require('./compile-scss');
const configSass = require('./config-sass');

module.exports = class SassCompiler extends ScssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    /*
    TODO: how to set the indentedSyntax option efficiently here??
     */
    const { sassEngine, sassOptions } = configSass(this);
    Object.assign(this, { sassEngine, sassOptions });
  }
};
