const HtmlCompiler = require('./compile-html');

module.exports = class NjkCompiler extends HtmlCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
  }
};
