const HtmlCompiler = require('./compile-html');

module.exports = class MdCompiler extends HtmlCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
  }
};
