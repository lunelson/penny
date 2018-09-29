// POSTCSS

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

module.exports = function(options) {
  const {
    isDev,
    browsers,
    postcssPlugins = function(postcss) {
      return postcss([
        autoprefixer({ browsers, grid: true })
      ]);
    }
  } = options;
  return postcssPlugins(postcss);
};
