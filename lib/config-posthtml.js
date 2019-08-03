const posthtml = require('posthtml');
const posthtmlPostcss = require('posthtml-postcss');
const postcssEnv = require('postcss-preset-env');

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
 * POSTHTML
 *   https://github.com/posthtml/posthtml
 *
 * POSTHTML-POSTCSS
 *   https://github.com/posthtml/posthtml-postcss
 *
 * MINIFIER
 *   https://github.com/Rebelmail/posthtml-minifier
 *   https://github.com/kangax/html-minifier
 *
 * OTHER RECOMMENDATIONS:
 *   prevent-widows
 *   posthtml-doctype
 *   posthtml-alt-always
 *   posthtml-collect-styles
 */

let posthtmlInstance = null;

module.exports = function(compiler) {
  const {
    srcFile,
    outFile,
    options: {
      isDev,
      postcssPlugins = [],
      postcssEnvOptions = {
        stage: 3,
        features: { 'custom-properties': false },
        autoprefixer: { grid: true },
      },
      posthtmlPlugins = [require('posthtml-minifier')({ removeComments: true })],
    },
  } = compiler;

  const postcssOptions = {
    from: srcFile,
    to: outFile,
    map: false,
  };

  posthtmlInstance =
    posthtmlInstance ||
    posthtml(
      [
        posthtmlPostcss(
          [postcssEnv(postcssEnvOptions)].concat(postcssPlugins),
          postcssOptions,
          /^text\/css$/,
        ),
      ].concat(isDev ? [] : posthtmlPlugins),
    );

  return {
    posthtmlInstance,
  };
};
