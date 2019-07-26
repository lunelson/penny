/**
 * POSTCSS
 *
 * (default plugin is autoprefixer with grid support)
 *
 * https://github.com/postcss/postcss#usage
 * https://github.com/postcss/autoprefixer
 * https://autoprefixer.github.io/
 */
const postcss = require('postcss');

let configured = null;

module.exports = function(options = {}) {
  if (configured) return configured;
  configured = postcss(
    options.postcssPlugins || [require('autoprefixer')({ grid: true })],
  );
  return configured;
};
