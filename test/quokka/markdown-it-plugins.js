// pug stuff

/*
## markdown-it plugins

use this article as a starting point, to model how you will modify markdown processing
  https://www.broculos.net/2015/12/build-your-own-markdown-flavour-with.html

- Custom EMbeds
  - https://github.com/rotorz/markdown-it-block-embed
- TOCs and heading anchors
  - https://www.npmjs.com/package/markdown-it-toc-done-right
  - https://www.npmjs.com/package/markdown-it-anchor
  - https://github.com/yuki-takei/markdown-it-toc-and-anchor-with-slugid
- Footnotes (ref pandoc)
  - https://www.npmjs.com/package/markdown-it-footnote
- Definition Lists (ref pandoc)
  - https://www.npmjs.com/package/markdown-it-deflist
- Checkboxes
  - https://www.npmjs.com/package/markdown-it-checkbox
- Code Highlighting
  - https://www.npmjs.com/package/markdown-it-prism
  - markdown-it-highlightjs

  MARKDOWN-IT TESTING

  additional formats
    markdown-it-footnote -- pandoc format http://pandoc.org/MANUAL.html#footnotes
    markdown-it-deflist -- pandoc format http://pandoc.org/MANUAL.html#definition-lists
    markdown-it-emoji -- see github emojis https://www.githubemojis.com/
    markdown-it-mark

  optional formats to consider
    markdown-it-anchor (will make a slug of the whole heading)
    markdown-it-checkbox

  custom containers
    https://github.com/markdown-it/markdown-it-container
    https://github.com/posva/markdown-it-custom-block

  standalone img/figure tags
    https://github.com/arve0/markdown-it-implicit-figures
    https://github.com/rotorz/markdown-it-block-image
    https://github.com/funkjunky/mdfigcaption
*/


const mdiContainer = require('markdown-it-container');
const mdiBlocks = require('markdown-it-custom-block');
const mdiMentions = require('markdown-it-mentions');

function setOpeningToken(token, cb) {
  if (token.nesting > 0) {
    const name = token.type.match(/container_(.+)_open/)[1];
    const args = token.info.trim().match(new RegExp(`^${name}\\s+(.*)$`));
    cb(name, (args && args[1].split(' ')) || []);
  }
}

const mdi = require('markdown-it')({
  html: true, // allow writing html (security is OK, because no user input)
  breaks: true, // line breaks = <br>
  typographer: true,
})

  .use(require('markdown-it-attrs'))
  // .use(require('markdown-it-implicit-figures'), { figcaption: true })
  .use(mdiContainer, 'figure', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'figure';
      tokens[idx].attrJoin('class', 'stack-xs')
      idx;
      tokens[idx].info; //?
      tokens[idx].attrs; //?
      // tokens[idx].attrs && self.renderAttrs(tokens[idx]); //?
      // tokens[idx];//?
      Object.getPrototypeOf(tokens[idx]);//?
      // Object.getPrototypeOf(self);//?
      var m = tokens[idx].info.trim().match(/^figure\s+(.*)$/); //?
      if (tokens[idx].nesting === 1) {
        return `<figure${tokens[idx].attrs?self.renderAttrs(tokens[idx]):''}><figcaption>${m?mdi.utils.escapeHtml(m[1]):''}</figcaption>`
      } else {
        return `</figure>`;
      }
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
  .use(require('markdown-it-footnote')) // pandoc format http://pandoc.org/MANUAL.html#footnotes
  .use(require('markdown-it-deflist')) // pandoc format http://pandoc.org/MANUAL.html#definition-lists
  .use(require('markdown-it-emoji')) // see github emojis https://www.githubemojis.com/
  .use(require('markdown-it-mark')) // allows ==text== format for <mark> tags (hilighting)
;

mdi.render(`
# test 1
this is a paragraph with a [link](/nowwhere) in it, and a @lunelson also in it

@[video](/foo/bar.mp4){.align-left}

::: figure something {.bleed-left}
### Heading up this section
<figcaption>hello world this is the caption</figcaption>
:::
`); //?
// const out = mdi.render(`

// ### hello world<br>this is a break{no-widows}

// ::: section {.bleed-left}
// ### Heading up this section
// :::

// /// spoiler hi there {.hello}
// some shit
// ///

// ![image alt text](/some/local/image.jpg){.left}

// @[example](hello)

// @[video](video.mp4)

// this is something with a footnote[^1] :grinning:
// and this is after the line break

// > and what about quotes
// if I just use a new line here?
// > citation

// [^1]: this is a footnote

// this is a further paragraph, nothing to do with the former

// Term 1
// : Definition 1

// Term 2 with *inline markup*

// : Definition 2

//   Third paragraph of definition 2.

//       { some code, part of Definition 2 }

// `); //?
