const fs = require('fs');
const path = require('path');

const requireResolve = require('resolve'); // for implementing require in put
// const requireFresh = require('requirefresh');
const Pug = require('pug');
const write = require('write');
const imageSize = require('image-size');
const _ = require('lodash');
const _dayjs = require('dayjs');
const _moment = require('moment');
const _dateFns = require('date-fns');
const _faker = require('faker');
const _chance = new (require('chance'))();
const _casual = require('casual');
const _case = require('change-case');

const configPostCSS = require('./config-postcss');
const configSass = require('./config-sass');

module.exports = function(compiler) {
  // deconstruct
  const {
    srcFile,
    depFiles,
    options,
    options: { isDev, srcDir },
  } = compiler;

  // const { sass, sassFunctions } = configSass(compiler);
  // const { postcss } = configPostCSS(compiler);

  const mdi = require('./config-md.js')(options);
  // define private methods
  // TODO: make srcDir and pubDir versions of this?
  function absolve(publicPath) {
    return publicPath[0] === '/'
      ? path.join(srcDir, publicPath)
      : path.resolve(path.dirname(srcFile), publicPath);
  }

  const pug = {};

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
      ['markdown'](str) {
        try {
          return '\n' + mdi.render(grayMatter(str).content.trim());
        } catch (error) {
          return `filter error: ${error.toString()}`;
        }
      },
      ['markdown-inline'](str) {
        try {
          return '\n' + mdi.renderInline(grayMatter(str).content.trim());
        } catch (error) {
          return `filter error: ${error.toString()}`;
        }
      },
      // ['scss'](data, { filename: file }) {
      //   try {
      //     const {
      //       css,
      //       // map,
      //       stats,
      //     } = sass.renderSync({
      //       data,
      //       file,
      //       ...sassOptions,
      //       sourceMap: false,
      //     });
      //     depFiles.push(...stats.includedFiles);
      //     return postcss.process(css, {
      //       from: file,
      //       map: false,
      //     }).css;
      //   } catch (error) {
      //     return `filter error: ${error.toString()}`;
      //   }
      // },
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
    markdown(str) {
      return '\n' + mdi.render(str && str.trim()).trim();
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
    pug,
    pugOptions,
    pugLocals,
  };
};
