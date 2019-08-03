const path = require('path');

const requireResolve = require('resolve');
const Nunjucks = require('nunjucks');
const imageSize = require('image-size');

const configLocals = require('./config-locals');
const configFilters = require('./config-filters');

/**
 *                    _            _
 *                   (_)          | |
 *  _ __  _   _ _ __  _ _   _  ___| | _____
 * | '_ \| | | | '_ \| | | | |/ __| |/ / __|
 * | | | | |_| | | | | | |_| | (__|   <\__ \
 * |_| |_|\__,_|_| |_| |\__,_|\___|_|\_\___/
 *                  _/ |
 *                 |__/
 *
 * OPTIONS:
 * autoescape (default: true)
 *   controls if output with dangerous characters are escaped automatically. See Autoescaping
 * throwOnUndefined (default: false)
 *   throw errors when outputting a null/undefined value
 * trimBlocks (default: false)
 *   automatically remove trailing newlines from a block/tag
 * lstripBlocks (default: false)
 *   automatically remove leading whitespace from a block/tag
 * watch (default: false)
 *   reload templates when they are changed (server-side). To use watch, make sure optional dependency chokidar is installed.
 * noCache (default: false)
 *   never use a cache and recompile templates each time (server-side)
 * web
 *   an object for configuring loading templates in the browser:
 *     useCache (default: false) will enable cache and templates will never see updates.
 *     async (default: false) will load templates asynchronously instead of synchronously (requires use of the asynchronous API for rendering).
 * express
 *   an express app that nunjucks should install to
 * tags: (default: see nunjucks syntax)
 *   defines the syntax for nunjucks tags. See Customizing Syntax
 */

module.exports = function(compiler) {
  // deconstruct
  const {
    srcFile,
    depFiles,
    options,
    options: { isDev, srcDir },
  } = compiler;

  const locals = configLocals(compiler);
  const filters = configFilters(compiler);

  function absolve(publicPath) {
    return publicPath[0] === '/'
      ? path.join(srcDir, publicPath)
      : path.resolve(path.dirname(srcFile), publicPath);
  }

  const njkEnv = Nunjucks.configure(srcDir, {
    noCache: true,
    trimBlocks: !isDev,
    lstripBlocks: !isDev,
  });

  Object.keys(filters).forEach(name => {
    njkEnv.addFilter(name, filters[name]);
  });

  njkEnv.on('load', (name, source, loader) => {
    depFiles.push(source.path);
  });

  const njkLocals = {
    // locals
    ...locals,

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

  // TODO: add boundFilters and boundLocals

  return {
    njkEnv,
    njkLocals,
  };
};
