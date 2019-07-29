const posthtml = require('posthtml');
const postcss = require('posthtml-postcss');

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
 */

let posthtmlInstance = null;

module.exports = function(compiler) {
  const {
    srcFile,
    outFile,
    depFiles,
    options: { isDev, srcDir, posthtmlPlugins, postcssPlugins },
  } = compiler;

  const postcssOptions = {
    from: srcFile,
    to: outFile,
    map: isDev ? { inline: true } : false,
  };

  posthtmlInstance =
    posthtmlInstance ||
    posthtml(
      [
        postcss(
          postcssPlugins || [require('autoprefixer')({ grid: true })],
          postcssOptions,
          /^text\/css$/,
        ),
      ].concat(
        posthtmlPlugins || isDev
          ? []
          : [require('posthtml-minifier')({ removeComments: true })],
      ),
    );

  return {
    posthtmlInstance,
    // posthtmlOptions,
  };
};
