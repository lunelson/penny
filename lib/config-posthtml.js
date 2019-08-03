const posthtml = require('posthtml');
const postcss = require('posthtml-postcss');

const configPostCSS = require('./config-postcss');

/**
 *                  _   _     _             _
 *                 | | | |   | |           | |
 *  _ __   ___  ___| |_| |__ | |_ _ __ ___ | |
 * | '_ \ / _ \/ __| __| '_ \| __| '_ ` _ \| |
 * | |_) | (_) \__ \ |_| | | | |_| | | | | | |
 * | .__/ \___/|___/\__|_| |_|\__|_| |_| |_|_|
 * | |
 * |_|
 *
 * https://github.com/posthtml/posthtml
 *
 * POSTCSS
 * https://github.com/posthtml/posthtml-postcss
 *
 * MINIFIER
 * https://github.com/Rebelmail/posthtml-minifier
 * https://github.com/kangax/html-minifier
 *
 * OTHER RECOMMENDATIONS:
 * posthtml-alt-always
 * posthtml-collect-styles
 * posthtml-doctype
 * prevent-widows
 */

let configured = null;

module.exports = function(compiler) {
  if (configured) return configured;
  const {
    options: { posthtmlPlugins, postcssPlugins },
  } = compiler;
  configured = posthtml(
    [
      postcss(postcssPlugins || [require('autoprefixer')({ grid: true })]),
    ].concat(
      posthtmlPlugins || [
        require('posthtml-minifier')({ removeComments: true }),
      ],
    ),
  );
  return configured;
};
