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
  .use(require('markdown-it-implicit-figures'), { figcaption: true })

  .use(mdiContainer, 'section', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'section';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'aside', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'aside';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'figure', {
    render: function(tokens, idx, _options, env, self) {
      // TODO: pick up arguments here, to apply to figcaption
      tokens[idx].tag = 'figure';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'nav', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'nav';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'div', {
    render: function(tokens, idx, _options, env, self) {
      tokens[idx].tag = 'div';
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'minimal', {
    render: function(tokens, idx, _options, env, self) {
      /*
      METHODS / PROPS
        token.type = container_${name}_open/_close
        token.info = raw params
        token.tag = div
        token.attrs = []
        token.block = true
        token.hidden = false
        token.content = ''
        token.attrPush(name, value)
        self.renderToken(tokens, idx, _options, env, self)
      */
      const token = tokens[idx];
      token.tag = 'minimal';
      setOpeningToken(token, (name, args) => {
        token.attrPush(['data-name', name]);
      });
      return self.renderToken(tokens, idx, _options, env, self)
    },
  })

  .use(mdiContainer, 'spoiler', {
    marker: '/',
    render: function(tokens, idx, _options, env, self) {
      const token = tokens[idx];
      var m = token.info.trim().match(/^spoiler\s+(.*)$/);
      // token.attrs;//?
      // self.renderAttrs.toString() //?
      // token.attrs && self.renderAttrs(token); //?
      // console.log(Object.getPrototypeOf(self));
      return token.nesting > 0 ?
        `<details${self.renderAttrs(token)}><summary>${mdi.utils.escapeHtml(m[1])}</summary>\n` :
          // content goes here
        '</details>\n';
    },
  })

  .use(mdiBlocks, {
    /* CUSTOM BLOCKS
      img, imgix, svg, video, youtube, twitter, codepen, codesandbox
    */
    example (arg) {
      return `<example-${arg}/>`;
    },
    video (url) {
      return `<video controls><source src="${url}" type="video/mp4"></video>`;
    }
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
`);//?
const out = mdi.render(`

### hello world<br>this is a break{no-widows}


::: section {.bleed-left}
### Heading up this section
:::

/// spoiler hi there {.hello}
some shit
///

![image alt text](/some/local/image.jpg){.left}

@[example](hello)

@[video](video.mp4)

this is something with a footnote[^1] :grinning:
and this is after the line break

> and what about quotes
if I just use a new line here?
> citation

[^1]: this is a footnote

this is a further paragraph, nothing to do with the former

Term 1
: Definition 1

Term 2 with *inline markup*

: Definition 2

  Third paragraph of definition 2.

      { some code, part of Definition 2 }

`); //?
