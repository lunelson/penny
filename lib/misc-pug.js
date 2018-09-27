// node
const path = require('path');

// npm
const nodeSass = require('node-sass');
const postCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');
const grayMatter = require('gray-matter');

// local
const sassFns = require('./misc-sass.js');
const { markdown, markdownInline } = require('./misc-mdi.js');

function initPugOptions(srcDir, pubDir, options) {

  const { browsers, isDev } = options;
  const post = postCSS([ autoPrefixer({ browsers, grid: true }) ]);

  // const post = postCSS([
  //   autoPrefixer({ browsers, grid: true })
  // ].concat(isDev?[]:[postCSSClean({})]));

  return function(srcFile, depFiles) {

    return {
      srcDir, pubDir, // make these accessible in templates!!
      cache: false,
      debug: false,
      globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
      name: false,
      self: false,
      doctype: 'html',
      basedir: srcDir,
      filename: srcFile,
      pretty: isDev,
      filters: {
        ['markdown'](str) { return '\n'+markdown(grayMatter(str).content); },
        ['markdown-inline'](str) { return '\n'+markdownInline(grayMatter(str).content); },
        ['scss'](data, { filename:file }) {
          const { css, map, stats } = nodeSass.renderSync({
            data, file,
            includePaths: ['node_modules', '.', path.dirname(file)],
            outputStyle: 'nested',
            sourceMap: false,
            functions: sassFns(file)
          });
          depFiles.push(...stats.includedFiles);
          return post.process(css, { from: file, map: false }).css;
        },
      }
    };
  };
}

module.exports = { initPugOptions };
