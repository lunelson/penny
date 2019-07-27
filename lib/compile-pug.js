const _ = require('lodash');
const Pug = require('pug');

const HtmlCompiler = require('./compile-html');
const configPug = require('./config-pug');

module.exports = class PugCompiler extends HtmlCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { pugOptions, pugLocals } = configPug(this);
    Object.assign(this, { pugOptions, pugLocals });
  }

  async compile() {
    const src = await this.source();
    return Pug.compile(src, this.pugOptions);
  }

  async render() {
    if (!this.template) this.template = await this.compile();
    const { $data, $routes } = this.options;
    const out = this.template(
      _.assign(this.pugLocals, {
        $data,
        $routes,
      }),
    );
    // passing to super applies postHTML
    return super.render(out);
  }
};
