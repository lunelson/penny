const Pug = require('pug');
const Ejs = require('ejs');
const Nunjucks = require('nunjucks');
const Stylus = require('stylus');
const grayMatter = require('gray-matter');
const _ = require('lodash');

const configPug = require('./config-pug');
const configEjs = require('./config-ejs');
const configNunucks = require('./config-njk');
const configMarkdownIt = require('./config-markdown-it');
const configStylus = require('./config-stylus');
const configSass = require('./config-sass');

module.exports = function(compiler) {
  const { srcFile, depFiles } = compiler;

  const { pugOptions, pugLocals } = configPug(compiler);
  const { ejsOptions, ejsLocals } = configEjs(compiler);
  const { njkEnv, njkLocals } = configNunucks(compiler);
  const { mdiInstance } = configMarkdownIt(compiler);
  const { sassEngine, sassOptions } = configSass(compiler);
  const { stylConfig } = configStylus(compiler);

  return {
    pug(str) {
      str = grayMatter(str).content;
      const template = Pug.compile(str, pugOptions);
      depFiles.push(...template.dependencies);
      const { $route } = compiler;
      return template(_.assign(pugLocals, { $route })).trim();
    },
    ejs(str) {
      str = grayMatter(str).content;
      const template = Ejs.compile(str, ejsOptions);
      depFiles.push(...template.dependencies);
      const { $route } = compiler;
      return template(_.assign(ejsLocals, { $route })).trim();
    },
    njk(str) {
      str = grayMatter(str).content;
      const { $route } = compiler;
      return Nunjucks.compile(str, njkEnv, srcFile)
        .render(_.assign(njkLocals, { $route }))
        .trim();
    },
    markdown(str, { inline } = {}) {
      str = grayMatter(str).content;
      return mdiInstance[inline ? 'renderInline' : 'render'](str).trim();
    },
    markdownInline(str) {
      str = grayMatter(str).content;
      return mdiInstance.renderInline(str).trim();
    },
    scss(data) {
      const { css, stats } = sassEngine.renderSync(
        _.assign(sassOptions, {
          data,
          sourceMap: false,
        }),
      );
      depFiles.push(...stats.includedFiles);
      return css.trim();
    },
    sass(data) {
      const { css, stats } = sassEngine.renderSync(
        _.assign(sassOptions, {
          data,
          sourceMap: false,
          indentedSyntax: true,
        }),
      );
      depFiles.push(...stats.includedFiles);
      return css.trim();
    },
    styl(data) {
      const compiled = Stylus(data).use(stylConfig);
      depFiles.push(...compiled.deps());
      const css = compiled.render();
      return css.trim();
    },
  };
};
