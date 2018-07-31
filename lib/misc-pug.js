// node
const path = require('path');

// npm
const Sass = require('node-sass');
const PostCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');

// local
const sassFns = require('./misc-sass.js');
const { markdown, markdownInline } = require('./misc-mdi.js');

function initPugOptions(srcDir, options) {

  const { browsers, isDev } = options;

  return function(srcFile, depFiles) {

    return {
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
        ['markdown'](str) { return '\n'+markdown(str); },
        ['markdown-inline'](str) { return '\n'+markdownInline(str); },
        ['scss'](data, { filename:file }) {
          const { css, map, stats } = Sass.renderSync({
            data, file,
            includePaths: ['node_modules', '.', path.dirname(file)],
            outputStyle: 'nested',
            sourceMap: false,
            functions: sassFns(file)
          });
          depFiles.push(...stats.includedFiles);
          return PostCSS([autoPrefixer({ browsers })]
            .concat(isDev?[]:[postCSSClean({})]))
            .process(css, { from: file, map: false })
            .css.toString();
        },
      }
    };
  };
}

module.exports = { initPugOptions };
