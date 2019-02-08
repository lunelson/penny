const mdiContainer = require('markdown-it-container');
const mdiBlocks = require('markdown-it-custom-block');
const mdiMentions = require('markdown-it-mentions');
const mdiPrism = require('markdown-it-prism');

module.exports = {
  browsers: [ '>1% in DE', 'last 5 years' ],
  logLevel: 'debug',
  webRoot: '_root',
  markdownItPlugins(mdi) {
    return mdi
      .use(require('markdown-it-attrs'))
      .use(mdiPrism, {
        plugins: [],
      })
      // .use(require('markdown-it-implicit-figures'), { figcaption: true })

      .use(mdiContainer, 'figure', {
        render: function(tokens, idx, _options, env, self) {
          const token = tokens[idx];
          var m = token.info.trim().match(/^spoiler\s+(.*)$/);
          token.attrs;
          self.renderAttrs.toString()
          token.attrs && self.renderAttrs(token);
          tokens[idx].tag = 'figure';
          return self.renderToken(tokens, idx, _options, env, self)
        },
      })

      .use(mdiBlocks, {
        /* CUSTOM BLOCKS
          img, imgix, svg, video, youtube, twitter, codepen, codesandbox
        */
        example (arg) { return `<example-${arg}/>`; },
        video (url) {
          return `<video controls><source src="${url}" type="video/mp4"></video>`;
        },
      })
      .use(mdiMentions, { external: true, parseURL(user) { return `https://twitter.com/${user}` } })
      .use(require('markdown-it-footnote'))
      .use(require('markdown-it-deflist'))
      .use(require('markdown-it-emoji'))
      .use(require('markdown-it-mark'))
    ;
    }
}
