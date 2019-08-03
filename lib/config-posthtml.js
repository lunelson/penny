const posthtml = require('posthtml');
const posthtmlPostcss = require('posthtml-postcss');

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
 * prevent-widows
 * posthtml-doctype
 * posthtml-alt-always
 * posthtml-collect-styles
 */

let configured = null;

module.exports = function(compiler) {
  if (configured) return configured;

  const {
    options: {
      postcssPlugins = [require('autoprefixer')({ grid: true })],
      posthtmlPlugins = [require('posthtml-minifier')({ removeComments: true })],
    },
  } = compiler;

  configured = posthtml([posthtmlPostcss(postcssPlugins)].concat(posthtmlPlugins));
  return configured;
};
