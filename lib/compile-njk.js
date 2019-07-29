const _ = require('lodash');
const Nunjucks = require('nunjucks');

const HtmlCompiler = require('./compile-html');
const configNunjucks = require('./config-nunjucks');

module.exports = class NjkCompiler extends HtmlCompiler {
  constructor(srcFile, options) {
    super(srcFile, options);
    const { njkEnv, njkLocals } = configNunjucks(this);
    Object.assign(this, { njkEnv, njkLocals });
    this.njkEnv.on('load', (name, source, loader) => {
      this.depFiles.push(source.path);
    });
  }

  async compile() {
    const src = await this.source();
    return Nunjucks.compile(src, this.njkEnv, this.srcFile);
  }

  async render() {
    if (!this.template) this.template = await this.compile();
    // reset depFiles; will be pushed by listener
    this.depFiles.length = 0;

    const { $data, $routes } = this.options;
    const out = this.template.render(
      _.assign(this.njkLocals, {
        $data,
        $routes,
      }),
    );
    // TODO: debug the logged dependencies here
    // passing to super applies postHTML
    return super.render(out);
  }
};
