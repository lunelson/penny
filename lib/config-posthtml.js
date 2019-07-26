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

module.exports = function(options = {}) {
  if (configured) return configured;
  configured = posthtml(
    options.posthtmlPlugins || [
      require('posthtml-minifier')({ removeComments: !options.isDev }),
    ],
  );
  return configured;
};
