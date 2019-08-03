const mdi = require('markdown-it');

/**
 *                       _       _                           _ _
 *                      | |     | |                         (_) |
 *  _ __ ___   __ _ _ __| | ____| | _____      ___ __ ______ _| |_
 * | '_ ` _ \ / _` | '__| |/ / _` |/ _ \ \ /\ / / '_ \______| | __|
 * | | | | | | (_| | |  |   < (_| | (_) \ V  V /| | | |     | | |_
 * |_| |_| |_|\__,_|_|  |_|\_\__,_|\___/ \_/\_/ |_| |_|     |_|\__|
 *
 * https://markdown-it.github.io/
 *
 * DEFAULT PLUGINS
 *
 * markdown-it-attrs
 *   similar to pandoc http://pandoc.org/MANUAL.html#extension-header_attributes
 * markdown-it-implicit-figures
 *   similar to pandoc 'implicit_figures' https://pandoc.org/MANUAL.html#images
 * markdown-it-footnote
 *   per pandoc format http://pandoc.org/MANUAL.html#footnotes
 * markdown-it-deflist
 *   per pandoc format http://pandoc.org/MANUAL.html#definition-lists
 *
 * RECOMMENDED PLUGINS
 *
 * markdown-it-emoji
 *   all github emoji codes https://www.githubemojis.com/
 * markdown-it-mark
 *   allows ==text== format for <mark> tags (hilighting)
 * markdown-it-mentions
 * markdown-it-container
 * markdown-it-custom-block
 * markdown-it-prism
 */

let configured = null;

module.exports = function(compiler) {
  if (configured) return configured;

  const {
    options: {
      mdiOptions = {
        html: true, // allow writing html (security is OK, because no user input)
        breaks: true, // line breaks = <br>
      },
      mdiPlugins = [
        [require('markdown-it-attrs')],
        [require('markdown-it-implicit-figures'), { figcaption: true }],
        [require('markdown-it-footnote')],
        [require('markdown-it-deflist')],
      ],
    },
  } = compiler;

  configured = mdi(mdiOptions);
  mdiPlugins.forEach(plugin => configured.use(...plugin));
  return configured;
};
