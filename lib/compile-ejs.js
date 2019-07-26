const HtmlCompiler = require('./compile-html');

module.exports = class EjsCompiler extends HtmlCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
  }
};
