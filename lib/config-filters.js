const Pug = require('pug');
const grayMatter = require('gray-matter');
const _ = require('lodash');

const configPug = require('./config-pug');
const configEjs = require('./config-ejs');
const configNunucks = require('./config-njk');
const configMarkdownIt = require('./config-md');
// const configPostCSS = require('./config-postcss');
const configStylus = require('./config-stylus');
const configSass = require('./config-sass');

module.exports = function(compiler) {
  const {
    srcFile,
    outFile,
    depFiles,
    options,
    options: { isDev, srcDir },
  } = compiler;

  const { pugOptions, pugLocals } = configPug(compiler);
  const { ejsOptions, ejsLocals } = configEjs(compiler);
  const { njkEnv, njkLocals } = configNunucks(compiler);
  const markdownIt = configMarkdownIt(options);
  // const postcss = configPostCSS(compiler);
  const { sassEngine, sassOptions } = configSass(compiler);
  const { stylConfig } = configStylus(compiler);

  return {
    pug(str) {
      const template = Pug.compile(str, pugOptions);
      depFiles.push(...template.dependencies);
      const { $data, $routes } = options;
      return template(
        _.assign(this.pugLocals, {
          $data,
          $routes,
        }),
      ).trim();
    },
    njk(str) {},
    ejs(str) {},
    md(str, { inline } = {}) {
      return markdownIt[inline ? 'renderInline' : 'render'](
        grayMatter(str).content.trim(),
      );
    },
    // md_inline(str) {
    //   return mdi.renderInline(grayMatter(str).content.trim());
    // },
    // css(data) {
    //   return postcss.process(data, {
    //     from: srcFile,
    //     to: outFile,
    //     map: false,
    //   }).css;
    // },
    scss(data) {
      const { css, stats } = sassEngine.renderSync(
        _.assign(sassOptions, {
          data,
          sourceMap: false,
        }),
      );
      depFiles.push(...stats.includedFiles);
      return css.trim();
      // return postcss.process(css, {
      //   from: srcFile,
      //   to: outFile,
      //   map: false,
      // }).css;
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
      // return postcss.process(css, {
      //   from: srcFile,
      //   to: outFile,
      //   map: false,
      // }).css;
    },
    styl(data) {
      const compiled = Stylus(data).use(stylConfig);
      depFiles.push(...compiled.deps());
      const css = compiled.render();
      return css.trim();
      // return postcss.process(css, {
      //   from: srcFile,
      //   to: outFile,
      //   map: false,
      // }).css;
    },
  };
};
