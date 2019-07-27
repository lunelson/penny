/**
 * POSTHTML
 *
 * (default plugin is html-minifier)
 *
 * https://github.com/posthtml/posthtml
 * https://github.com/Rebelmail/posthtml-minifier
 * https://github.com/kangax/html-minifier
 *
 */
const posthtml = require('posthtml');

let configured = null;

module.exports = function(compiler) {
  if (configured) return configured;
  const { options } = compiler;
  configured = posthtml(
    options.posthtmlPlugins || [
      require('posthtml-minifier')({ removeComments: true }),
    ],
  );
  return configured;
};
