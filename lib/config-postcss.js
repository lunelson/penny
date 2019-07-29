const postcss = require('postcss');

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
 * https://github.com/postcss/postcss#usage
 *
 * AUTOPREFIXER
 * https://github.com/postcss/autoprefixer
 * https://autoprefixer.github.io/
 */

let configured = null;

module.exports = function(compiler) {
  if (configured) return configured;
  const { options } = compiler;
  configured = postcss(
    options.postcssPlugins || [require('autoprefixer')({ grid: true })],
  );
  return configured;
};