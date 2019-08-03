const path = require('path');

const requireResolve = require('resolve');
const Pug = require('pug');
const imageSize = require('image-size');

const configLocals = require('./config-locals');
const configFilters = require('./config-filters');

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
    depFiles,
    options: { isDev, srcDir },
  } = compiler;

  const locals = configLocals(compiler);
  const filters = configFilters(compiler);

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
    filters,
  };

  const pugLocals = {
    // locals
    ...locals,

    // filters
    ...filters,

    // utilities
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
      delete require.cache[srcModule];
      return require(srcModule);
    },
  };

  const boundLocals = {
    include(relFile) {
      const absFile = absolve(relFile);
      const template = Pug.compileFile(absFile, this.compiler.pugOptions);
      this.compiler.depFiles.push(absFile, ...template.dependencies);
      return '\n' + template(this).trim();
    },
    render(str) {
      const template = Pug.compile(str, this.compiler.pugOptions);
      this.compiler.depFiles.push(...template.dependencies);
      return '\n' + template(this).trim();
    },
  };

  Object.keys(boundLocals).forEach(fn => {
    pugLocals[fn] = boundLocals[fn].bind(pugLocals);
  });

  // TODO: add boundFilters

  return {
    pugOptions,
    pugLocals,
  };
};
