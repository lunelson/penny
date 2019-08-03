const postcss = require('postcss');
const postcssEnv = require('postcss-preset-env');

/**
 *                  _
 *                 | |
 *  _ __   ___  ___| |_ ___ ___ ___
 * | '_ \ / _ \/ __| __/ __/ __/ __|
 * | |_) | (_) \__ \ || (__\__ \__ \
 * | .__/ \___/|___/\__\___|___/___/
 * | |
 * |_|
 *
 * POSTCSS
 *   https://github.com/postcss/postcss#usage
 *
 * POSTCSS-PRESET-ENV
 *   https://github.com/csstools/postcss-preset-env
 *   https://preset-env.cssdb.org/playground
 */

let postcssInstance = null;

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
    },
  } = compiler;

  const postcssOptions = {
    from: srcFile,
    to: outFile,
    map: isDev ? { inline: true } : false,
  };

  postcssInstance =
    postcssInstance || postcss([postcssEnv(postcssEnvOptions)].concat(postcssPlugins));

  return {
    postcssInstance,
    postcssOptions,
  };
};
