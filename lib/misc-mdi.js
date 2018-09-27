const mdi = require('markdown-it')({
  breaks: true,
})
  .use(require('markdown-it-attrs'))
  .use(require('markdown-it-implicit-figures'), { figcaption: true })
  // .use(require('markdown-it-custom-block'))
  .use(require('markdown-it-mark'))
  .use(require('markdown-it-deflist'))
  .use(require('markdown-it-emoji'))
  .use(require('markdown-it-footnote'));

function markdown(str) {
  return mdi.render(str).trim(); }
function markdownInline(str) {
  return mdi.renderInline(str).trim(); }

module.exports = { markdown, markdownInline };
