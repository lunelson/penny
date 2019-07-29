const _ = require('lodash');
const Ejs = require('ejs');

const HtmlCompiler = require('./compile-html');
const configEjs = require('./config-ejs');

module.exports = class EjsCompiler extends HtmlCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { ejsOptions, ejsLocals } = configEjs(this);
    Object.assign(this, { ejsOptions, ejsLocals });
  }

  async compile() {
    const src = await this.source();
    return Ejs.compile(src, this.ejsOptions);
  }

  async render() {
    if (!this.template) this.template = await this.compile();
    // only reset depFiles if compilation worked !!
    this.depFiles.length = 0;
    this.depFiles.push(...this.template.dependencies);

    const { $data, $routes } = this.options;
    const out = this.template(
      _.assign(this.ejsLocals, {
        $data,
        $routes,
      }),
    );
    // TODO: debug the logged dependencies here
    // passing to super applies postHTML
    return super.render(out);
  }
};
