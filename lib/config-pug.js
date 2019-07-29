const fs = require('fs');
const path = require('path');

const requireResolve = require('resolve'); // for implementing require in put
// const requireFresh = require('requirefresh');
const Pug = require('pug');
const Stylus = require('stylus');
const write = require('write');
const imageSize = require('image-size');
const grayMatter = require('gray-matter');
const _ = require('lodash');
const _dayjs = require('dayjs');
const _moment = require('moment');
const _dateFns = require('date-fns');
const _faker = require('faker');
const _chance = new (require('chance'))();
const _casual = require('casual');
const _case = require('change-case');

const configMarkdownIt = require('./config-md.js');
const configPostCSS = require('./config-postcss');
const configStylus = require('./config-stylus');
const configSass = require('./config-sass');

/**
 *  _ __  _   _  __ _
 * | '_ \| | | |/ _` |
 * | |_) | |_| | (_| |
 * | .__/ \__,_|\__, |
 * | |           __/ |
 * |_|          |___/
 *
 * https://pugjs.org/api/reference.html
 */

module.exports = function(compiler) {
  const {
    srcFile,
    outFile,
    depFiles,
    options,
    options: { isDev, srcDir },
  } = compiler;

  const { sassEngine, sassOptions } = configSass(compiler);
  const { stylConfig } = configStylus(compiler);
  const postcss = configPostCSS(compiler);
  const mdi = configMarkdownIt(options);

  function absolve(publicPath) {
    return publicPath[0] === '/'
      ? path.join(srcDir, publicPath)
      : path.resolve(path.dirname(srcFile), publicPath);
  }

  const pugOptions = {
    globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
    cache: false,
    debug: false,
    name: false,
    self: false,
    doctype: 'html',
    basedir: srcDir,
    filename: srcFile,
    pretty: isDev,
    filters: {
      markdown(str, { inline } = {}) {
        return mdi[inline ? 'renderInline' : 'render'](
          grayMatter(str).content.trim(),
        );
      },
      markdownInline(str) {
        return mdi.renderInline(grayMatter(str).content.trim());
      },
      css(data) {
        return postcss.process(data, {
          from: srcFile,
          to: outFile,
          map: false,
        }).css;
      },
      scss(data) {
        const { css, stats } = sassEngine.renderSync(
          _.assign(sassOptions, {
            data,
            sourceMap: false,
          }),
        );
        depFiles.push(...stats.includedFiles);
        return postcss.process(css, {
          from: srcFile,
          to: outFile,
          map: false,
        }).css;
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
        return postcss.process(css, {
          from: srcFile,
          to: outFile,
          map: false,
        }).css;
      },
      styl(data) {
        const compiled = Stylus(data).use(stylConfig);
        depFiles.push(...compiled.deps());
        const css = compiled.render();
        return postcss.process(css, {
          from: srcFile,
          to: outFile,
          map: false,
        }).css;
      },
    },
  };

  const pugLocals = {
    $env: isDev ? 'development' : 'production',
    $compiler: compiler,

    // data gen
    _faker,
    _chance,
    _casual,

    // dates
    _dayjs,
    _moment,
    _dateFns,
    // utils
    _,
    _case,
    // node
    __fs: fs,
    __path: path,

    // utilities
    dump(value) {
      return JSON.stringify(value, null, 2);
    },
    markdown(str, { inline } = {}) {
      return (
        '\n' + mdi[inline ? 'renderInline' : 'render'](str && str.trim()).trim()
      );
    },
    markdownInline(str) {
      return '\n' + mdi.renderInline(str && str.trim()).trim();
    },

    // markdownFile(relFile) {
    //   const absFile = absolve(relFile);
    //   const { content } = grayMatter(fs.readFileSync(absFile, 'utf8'));
    //   depFiles.push(absFile);
    //   return '\n' + mdi.render(content.trim()).trim();
    // },
    writeToFile(relFile, content, force = true) {
      const absFile = absolve(relFile);
      if (!force && fs.existsSync(absFile)) return false;
      return write.sync(absFile, content);
    },
    imageSize(relImg) {
      const absImg = absolve(relImg);
      depFiles.push(absImg);
      return imageSize(absImg);
    },
    require(relModule) {
      const srcModule = requireResolve.sync(relModule, {
        basedir: path.dirname(srcFile),
      });
      depFiles.push(srcModule);
      // return requireFresh(srcModule);
      delete require.cache[srcModule];
      return require(srcModule);
    },
  };

  const pugBoundFns = {
    include(relFile) {
      const absFile = absolve(relFile);
      const templateFn = Pug.compileFile(absFile, this.compiler.pugOptions);
      this.compiler.depFiles.push(absFile, ...templateFn.dependencies);
      return '\n' + templateFn(this).trim();
    },
    render(str) {
      const templateFn = Pug.compile(str, this.compiler.pugOptions);
      this.compiler.depFiles.push(...templateFn.dependencies);
      return '\n' + templateFn(this).trim();
    },
  };

  Object.keys(pugBoundFns).forEach(fn => {
    pugLocals[fn] = pugBoundFns[fn].bind(pugLocals);
  });

  return {
    pugOptions,
    pugLocals,
  };
};
