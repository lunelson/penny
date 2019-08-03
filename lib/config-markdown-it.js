/**
 *                       _       _                           _ _
 *                      | |     | |                         (_) |
 *  _ __ ___   __ _ _ __| | ____| | _____      ___ __ ______ _| |_
 * | '_ ` _ \ / _` | '__| |/ / _` |/ _ \ \ /\ / / '_ \______| | __|
 * | | | | | | (_| | |  |   < (_| | (_) \ V  V /| | | |     | | |_
 * |_| |_| |_|\__,_|_|  |_|\_\__,_|\___/ \_/\_/ |_| |_|     |_|\__|
 *
 * https://markdown-it.github.io/
 */

const mdi = require('markdown-it');

let mdiInstance = null;

module.exports = function(compiler) {

  if (mdiInstance) return mdiInstance;

  const {
    options: {
      mdiOptions = {
        html: true, // allow writing html (security is OK, because no user input)
        breaks: true, // line breaks = <br>
        // typographer: true, // ?? good idea ??
      },
      mdiPlugins = [
        [require('markdown-it-attrs')], // similar to pandoc http://pandoc.org/MANUAL.html#extension-header_attributes
        [require('markdown-it-implicit-figures'), { figcaption: true }], // similar to pandoc 'implicit_figures' https://pandoc.org/MANUAL.html#images
        [require('markdown-it-footnote')], // per pandoc format http://pandoc.org/MANUAL.html#footnotes
        [require('markdown-it-deflist')], // per pandoc format http://pandoc.org/MANUAL.html#definition-lists
        // [require('markdown-it-emoji')], // all github emoji codes https://www.githubemojis.com/
        // [require('markdown-it-mark')], // allows ==text== format for <mark> tags (hilighting)
      ],
    },
  } = compiler;

  mdiInstance = mdi(mdiOptions);
  mdiPlugins.forEach(plugin => mdiInstance.use(...plugin));
  return mdiInstance;
};
