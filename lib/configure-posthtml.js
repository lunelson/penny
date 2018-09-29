// POSTHTML

const posthtml = require('posthtml');

module.exports = function(options) {
  const {
    isDev,
    posthtmlPlugins = function(posthtml) {
      return posthtml()
        .use(require('posthtml-minifier')({
          removeComments: true,
          collapseWhitespace: true,
          // conservativeCollapse: true,
        }));
    }
  } = options;
  return posthtmlPlugins(posthtml);
};
