// MARKDOWN-IT

const mdi = require('markdown-it');

module.exports = function(options) {
  const {
    markdownItOptions = {
      html: true, // allow writing html (security is OK, because no user input)
      breaks: true, // line breaks = <br>
      typographer: true, // ?? good idea ??
    },
    markdownItPlugins = function(md) {
      return md
        .use(require('markdown-it-attrs')) // similar to pandoc http://pandoc.org/MANUAL.html#extension-header_attributes
        .use(require('markdown-it-footnote')) // per pandoc format http://pandoc.org/MANUAL.html#footnotes
        .use(require('markdown-it-deflist')) // per pandoc format http://pandoc.org/MANUAL.html#definition-lists
        .use(require('markdown-it-emoji')) // all github emoji codes https://www.githubemojis.com/
        .use(require('markdown-it-mark')); // allows ==text== format for <mark> tags (hilighting)
    }
  } = options;
  return markdownItPlugins(mdi(markdownItOptions));
};
