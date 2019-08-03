const path = require('path');

const stylus = require('stylus');
var findup = require('findup-sync');

const readData = require('./config-data');

const { nodes, utils } = stylus;

/**
 *      _         _
 *     | |       | |
 *  ___| |_ _   _| |_   _ ___
 * / __| __| | | | | | | / __|
 * \__ \ |_| |_| | | |_| \__ \
 * |___/\__|\__, |_|\__,_|___/
 *           __/ |
 *          |___/
 *
 * http://stylus-lang.com/docs/js.html
 * https://github.com/stylus/stylus
 */

module.exports = function(compiler) {
  const {
    srcFile,
    outFile,
    depFiles,
    options: { isDev, srcDir },
  } = compiler;

  function absolve(relPath) {
    return relPath[0] === '/'
      ? path.join(srcDir, relPath)
      : path.resolve(path.dirname(srcFile), relPath);
  }

  const functions = {
    // PENNY FUNCTIONS
    'read-data'(relFile) {
      utils.assertType(relFile, 'string', 'relFile');
      const absFile = absolve(relFile);
      depFiles.push(absFile);
      return readData.sync(absFile);
    },

    // MATH FUNCTIONS
    /* eslint-disable prettier/prettier */
    // numeric
    sign(x) { return new nodes.Unit(Math.sign(x)); },
    trunc(x) { return new nodes.Unit(Math.trunc(x)); },
    pow(x, y) { return new nodes.Unit(Math.pow(x, y)); },
    sqrt(x) { return new nodes.Unit(Math.sqrt(x)); },
    cbrt(x) { return new nodes.Unit(Math.cbrt(x)); },
    exp(x) { return new nodes.Unit(Math.exp(x)); },
    expm1(x) { return new nodes.Unit(Math.expm1(x)); },
    log(x) { return new nodes.Unit(Math.log(x)); },
    log1p(x) { return new nodes.Unit(Math.log1p(x)); },
    log10(x) { return new nodes.Unit(Math.log10(x)); },
    log2(x) { return new nodes.Unit(Math.log2(x)); },
    hypot(x, y) { return new nodes.Unit(Math.hypot(x, y)); },
    // trigonometric
    deg2rad(deg) { return new nodes.Unit(deg * Math.PI / 180) },
    rad2deg(rad) { return new nodes.Unit(rad * 180 / Math.PI) },
    // NB: sin, cos and tan already exist in Stylus
    acos(x) { return new nodes.Unit(Math.acos(x)); },
    asin(x) { return new nodes.Unit(Math.asin(x)); },
    atan(x) { return new nodes.Unit(Math.atan(x)); },
    atan2(y, x) { return new nodes.Unit(Math.atan2(y, x)); },
    // acosh(x) { return new nodes.Unit(Math.acosh(x)); },
    // asinh(x) { return new nodes.Unit(Math.asinh(x)); },
    // atanh(x) { return new nodes.Unit(Math.atanh(x)); },
    // cosh(x) { return new nodes.Unit(Math.cosh(x)); },
    /* eslint-enable prettier/prettier */
  };
  const stylConfig = stylus => {
    stylus.set('filename', srcFile); // srcFile
    stylus.set('nocheck', true); // we know the file exists
    stylus.set('paths', [
      findup('node_modules', {
        cwd: srcDir,
      }),
      srcDir,
    ]); // node_modules, srcDir
    stylus.set('sourcemap', {
      comment: isDev, // Adds a comment with the`sourceMappingURL` to the generated CSS(default: `true`)
      inline: true, // Inlines the sourcemap with full source text in base64 format(default: `false`)
      sourceRoot: path.relative(outFile, srcDir), // "sourceRoot" property of the generated sourcemap
      basePath: path.dirname(srcFile), // Base path from which sourcemap and all sources are relative(default: `.`)
    });
    Object.keys(functions).forEach(name => {
      stylus.define(name, functions[name]);
    });
  };

  return {
    stylConfig,
  };
};
