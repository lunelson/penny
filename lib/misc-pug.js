// node
const path = require('path');

// npm
const nodeSass = require('node-sass');
const postCSS = require('postcss');
const autoPrefixer = require('autoprefixer');
const grayMatter = require('gray-matter');

module.exports = function (srcDir, pubDir, options) {

  const mdi = require('./config-markdown-it.js')(options);

  const configureNodeSass = require('./config-node-sass.js')(srcDir, options);

  const {
    // browsers,
    isDev
  } = options;

  const post = postCSS([autoPrefixer({
    // browsers,
    grid: true
  })]);

  return function (srcFile, depFiles) {

    return {
      // srcDir,
      // pubDir, // make these accessible in templates!!
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
        ['scss'](data, {
          filename: file
        }) {
          try {
            const {
              css,
              // map,
              stats
            } = nodeSass.renderSync({
              data,
              file,
              ...configureNodeSass(file, depFiles),
              sourceMap: false
            });
            depFiles.push(...stats.includedFiles);
            return post.process(css, {
              from: file,
              map: false
            }).css;
          } catch (error) {
            return `filter error: ${error.toString()}`;
          }
        },
      }
    };
  };
};
