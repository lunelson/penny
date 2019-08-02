// MARKDOWN-IT

const mdi = require('markdown-it');
let initialized = null;

module.exports = function(options = {}) {
  // return early, if it has already been set up
  if (initialized) return initialized;

  // this way of parsing is naive and too clever;
  // should check whether the supplied options are valid type at least
  const {
    markdownItOptions: mdiOptions = {
      html: true, // allow writing html (security is OK, because no user input)
      breaks: true, // line breaks = <br>
      typographer: true, // ?? good idea ??
    },
    markdownItPlugins: mdiPlugins = function(mdInit) {
      return (
        mdInit
          .use(require('markdown-it-attrs')) // similar to pandoc http://pandoc.org/MANUAL.html#extension-header_attributes
          .use(require('markdown-it-implicit-figures'), { figcaption: true }) // similar to pandoc 'implicit_figures' https://pandoc.org/MANUAL.html#images
          .use(require('markdown-it-footnote')) // per pandoc format http://pandoc.org/MANUAL.html#footnotes
          .use(require('markdown-it-deflist')) // per pandoc format http://pandoc.org/MANUAL.html#definition-lists
          .use(require('markdown-it-emoji')) // all github emoji codes https://www.githubemojis.com/
          .use(require('markdown-it-mark'))
      ); // allows ==text== format for <mark> tags (hilighting)
    },
  } = options;

  initialized = mdiPlugins(mdi(mdiOptions));
  return initialized;
};

// standalone img / figure tags
// https://github.com/arve0/markdown-it-implicit-figures
// https://github.com/rotorz/markdown-it-block-image
// https://github.com/funkjunky/mdfigcaption
