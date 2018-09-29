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

const md = require('markdown-it')({
  html: true, // allow writing html (security is OK, because no user input)
  breaks: true, // line breaks = <br>
  typographer: true,
})
  // NB order of processing is from bottom to top
  .use(require('markdown-it-attrs'))
  // .use(require('markdown-it-anchor'))
  .use(require('markdown-it-implicit-figures'), { figcaption: true })
  .use(require('markdown-it-container'), 'spoiler', {

    validate: function(params) {
      return params.trim().match(/^spoiler\s+(.*)$/);
    },

    render: function (tokens, idx) {
      var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);

      if (tokens[idx].nesting === 1) {
        // opening tag
        return '<details><summary>' + md.utils.escapeHtml(m[1]) + '</summary>\n';

      } else {
        // closing tag
        return '</details>\n';
      }
    }
  })
  .use(require('markdown-it-custom-block'), {
    example (arg) {
      return `<example-${arg}/>`
    },
    video (url) {
      return `<video controls><source src="${url}" type="video/mp4"></video>`
    }
  })
  .use(require('markdown-it-footnote')) // pandoc format http://pandoc.org/MANUAL.html#footnotes
  .use(require('markdown-it-deflist')) // pandoc format http://pandoc.org/MANUAL.html#definition-lists
  .use(require('markdown-it-emoji')) // see github emojis https://www.githubemojis.com/
  .use(require('markdown-it-mark')) // allows ==text== format for <mark> tags (hilighting)
;

const out = md.render(`

### hello world<br>this is a break{no-widows}

::: spoiler hi there
some shit
:::

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
