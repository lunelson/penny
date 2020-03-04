// npm
const pug = require('pug');
const nodeSass = require('node-sass');
const postCSS = require('postcss');
const autoPrefixer = require('autoprefixer');
const grayMatter = require('gray-matter');
const stripIndent = require('strip-indent');

module.exports = function(srcDir, pubDir, options) {

  const mdi = require('./config-markdown-it.js')(options);

  const configureNodeSass = require('./config-node-sass.js')(srcDir, options);

  const {
    isDev
  } = options;

  const post = postCSS([autoPrefixer({
    grid: true
  })]);

  return function(srcFile, depFiles) {

    const pugOptions = {
      cache: false,
      debug: false,
      globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
      name: false,
      self: false,
      doctype: 'html',
      basedir: srcDir,
      filename: srcFile,
      pretty: isDev
    };

    return {
      // srcDir,
      // pubDir, // make these accessible in templates!!
      ...pugOptions,
      filters: {
        ['cdata'] (str, { context = 'script' } = {}) {
          const re = /]]>/g;
          const [start, end] = {
            script: ['//<![CDATA[\n', '\n//]]>'],
            style: ['/*<![CDATA[*/\n', '\n/*]]>*/'],
            xml: ['<![CDATA[', ']]>'],
          }[context];
          const escaped = str.replace(re, ']]]]><![CDATA[>');
          return start + escaped + end;
        },
        ['inspect'] (str, options) {
          return JSON.stringify(options);
        },
        ['markdown'] (str, { mixins, filename, basedir }) {
          try {
            const { content } = grayMatter(str);
            return '\n' + mdi.render(content.replace(/\[\[\[([\s\S]+?)\]\]\]/gm, (match, group, offset, src) => {
              return pug.render(`${mixins ? `include ${mixins}\n`:''}${stripIndent(group)}`, { ...pugOptions, filename });
            }));
          } catch (error) {
            return `filter error: ${error.toString()}`;
          }
        },
        ['markdown-inline'] (str) {
          try {
            return '\n' + mdi.renderInline(grayMatter(str).content.trim());
          } catch (error) {
            return `filter error: ${error.toString()}`;
          }
        },
        ['scss'] (data, {
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
