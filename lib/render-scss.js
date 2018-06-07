//                     _
//                    | |
//  _ __ ___ _ __   __| | ___ _ __ ______ ___  ___ ___ ___
// | '__/ _ \ '_ \ / _` |/ _ \ '__|______/ __|/ __/ __/ __|
// | | |  __/ | | | (_| |  __/ |         \__ \ (__\__ \__ \
// |_|  \___|_| |_|\__,_|\___|_|         |___/\___|___/___/

// node
const { relative, dirname } = require('path');

// npm
const Sass = require('node-sass');
const PostCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');

// local
const sassFns = require('./util/sass-fns');
const { replaceExt } = require('./utils');
const { cssErr } = require('./errors');

// export
module.exports = function({srcDir, loggerFn, options}) {

  const { isDev, isBuild, browsers } = options;

  return function(srcFile) {
    const file = relative(process.cwd(), srcFile);
    const outFile = replaceExt(file, '.css');
    return new Promise((resolve, reject) => {
      Sass.render(
        {
          file, outFile,
          includePaths: ['node_modules', '.', dirname(file)],
          outputStyle: 'nested',
          sourceMap: isDev,
          functions: sassFns(srcFile)
        },
        (err, data) => {
          if (err) reject(err);
          resolve(data);
        }
      );
    }).then(data => {
      // http://api.postcss.org/global.html#processOptions
      return PostCSS([autoPrefixer({ browsers })]
        .concat(isDev?[]:[postCSSClean({})]))
        .process(data.css, {
          from: file,
          to: outFile,
          map: data.map ? { inline: true, prev: data.map.toString() } : false
        });
    })

      .then(data => data.css)
      .catch(err => {
        if (isBuild) throw Error(err);
        // TODO: verify that this is the best thing to return
        loggerFn.error(err.formatted);
        return cssErr(err.formatted, '#F2E6EA');
      });
  };
};
