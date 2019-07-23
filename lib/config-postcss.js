// POSTCSS

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

module.exports = function (options) {
  const {
    isDev,
    postcssPlugins = function (postcss) {
      return postcss([
        autoprefixer({ grid: true })
      ]);
    }
  } = options;
  return postcssPlugins(postcss);
};
