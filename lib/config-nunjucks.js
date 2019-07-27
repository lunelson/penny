const fs = require('fs');
const path = require('path');

const Nunjucks = require('nunjucks');
const grayMatter = require('gray-matter');
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
  /*
  CONFIGURATION
  nunjucks.configure([path], [opts]);
  returns an Environment instance, which lets you add filters and extensions while still using the simple API, e.g. compile()

  Tell nunjucks that your templates live at path and flip any feature on or off with the opts hash. You can provide both arguments or either of them. path defaults to the current working directory, and the following options are available in opts:

      autoescape (default: true)
        controls if output with dangerous characters are escaped automatically. See Autoescaping
      throwOnUndefined (default: false)
        throw errors when outputting a null/undefined value
      trimBlocks (default: false)
        automatically remove trailing newlines from a block/tag
      lstripBlocks (default: false)
        automatically remove leading whitespace from a block/tag
      watch (default: false)
        reload templates when they are changed (server-side). To use watch, make sure optional dependency chokidar is installed.
      noCache (default: false)
        never use a cache and recompile templates each time (server-side)
      web
        an object for configuring loading templates in the browser:
          useCache (default: false) will enable cache and templates will never see updates.
          async (default: false) will load templates asynchronously instead of synchronously (requires use of the asynchronous API for rendering).
      express
        an express app that nunjucks should install to
      tags: (default: see nunjucks syntax)
        defines the syntax for nunjucks tags. See Customizing Syntax
  */
  // deconstruct
  const {
    srcFile,
    depFiles,
    options,
    options: { isDev, srcDir },
  } = compiler;

  const { sassEngine, sassOptions } = configSass(compiler);
  const postcss = configPostCSS(compiler);

  const mdi = require('./config-md.js')(options);

  const njkEnv = Nunjucks.configure(srcDir, {
    noCache: true,
    trimBlocks: !isDev,
    lstripBlocks: !isDev,
  });

  const filters = {
    markdown(str, { inline } = {}) {
      return mdi[inline ? 'renderInline' : 'render'](
        grayMatter(str).content.trim(),
      );
    },
    markdownInline(str) {
      return mdi.renderInline(grayMatter(str).content.trim());
    },
    sass(data) {
      const { css, stats } = sassEngine.renderSync({
        ...sassOptions,
        data,
        file: srcFile,
        sourceMap: false,
        indentedSyntax: true,
      });
      depFiles.push(...stats.includedFiles);
      return postcss.process(css, {
        from: srcFile,
        map: false,
      }).css;
    },
    scss(data) {
      const { css, stats } = sassEngine.renderSync({
        ...sassOptions,
        data,
        file: srcFile,
        sourceMap: false,
      });
      depFiles.push(...stats.includedFiles);
      return postcss.process(css, {
        from: srcFile,
        map: false,
      }).css;
    },
  };

  Object.keys(filters).forEach(name => {
    njkEnv.addFilter(name, filters[name]);
  });

  const njkLocals = {
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
  };

  return {
    njkEnv,
    njkLocals,
  };
};
