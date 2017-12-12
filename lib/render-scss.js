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
const { scssLogger } = require('./loggers');
const { sassFns } = require('./utils-scss');
const { replaceExt } = require('./utils');
const { cssErr } = require('./errors');


module.exports = function(baseDir, isDev, options) {

  /*
  NEW PATTERN: POSTCSS, SASS, POSTCSS

  const doLinting = true;

  const lintPass = true;
  const renderPass = true;
  const postPass = true;

  const testPromise = (doLinting ? new Promise((resolve, reject) => {
    if (!lintPass) return reject('linting error');
    return resolve('lint OK');
  }) : Promise.resolve('lint OK'))
  .then((value) => {
    return new Promise((resolve, reject) => {
      if (!renderPass) return reject('render error');
      return resolve(value + ' render OK');
    })
  })
  .then((value) => {
    return new Promise((resolve, reject) => {
      if (!postPass) return reject('postcss error');
      return resolve(value + ' postcss OK');
    })
  })
  .then((value) => `rendered: ${value}`)
  .catch((value) => `rendered: ${value}`)

  // check what we got
  testPromise.then(console.log);

  */

  // global setup
  const procDir = process.cwd();
  // const relDir = relative(procDir, baseDir);
  const clean = postCSSClean({});
  const prefix = autoPrefixer({ browsers: options.browsersList });

  return function(srcFile, renderTimes) {

    // local setup
    const relFile = relative(procDir, srcFile);
    // const outFile = relFile.replace(/\.scss$/, '.css');
    const outFile = replaceExt(relFile, '.css');
    // const postCSS = PostCSS([prefix].concat(isDev?[]:[clean]));

    return new Promise((resolve, reject) => {
      Sass.render(
        {
          file: relFile,
          outFile: outFile,
          includePaths: ['node_modules', '.', dirname(relFile)],
          outputStyle: 'nested',
          sourceMap: isDev,
          functions: sassFns
        },
        (err, data) => {
          if (err) reject(err);
          resolve(data);
        }
      );
    })
      .then(data => {
        // http://api.postcss.org/global.html#processOptions
        return PostCSS([prefix].concat(isDev?[]:[clean]))
          .process(data.css, {
            from: relFile,
            to: outFile,
            map: data.map ? { inline: true, prev: data.map.toString() } : false
          });
      })
      .then(data => {
        renderTimes && (renderTimes[srcFile] = Date.now());
        return data.css;
      })
      .catch(err => {
        renderTimes && (renderTimes[srcFile] = Date.now());
        scssLogger(err);
        return cssErr(err.formatted, '#F2E6EA');
      });
  };
};
