const CssCompiler = require('./compile-css');

module.exports = class StylCompiler extends CssCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
  }
};
