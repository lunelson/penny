const fs = require('fs');

const HtmlCompiler = require('./compile-html');

module.exports = class PugCompiler extends HtmlCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
  }

  render(src) {
    src = src || fs.readFileSync(this.srcFile, 'utf8');
    const html = src;
    // passing to super.render applies postHTML
    return super.render(html);
  }
};
