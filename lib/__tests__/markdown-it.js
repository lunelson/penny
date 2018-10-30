const rcOptions = {
  markdownItOptions: {
    html: true, // allow writing html (security is OK, because no user input)
    breaks: true, // line breaks = <br>
    typographer: true, // ?? good idea ??
  },

  markdownItPlugins: function(md) {
    return md
      .use(require('markdown-it-attrs')) // similar to pandoc http://pandoc.org/MANUAL.html#extension-header_attributes
      .use(require('markdown-it-footnote')) // per pandoc format http://pandoc.org/MANUAL.html#footnotes
      .use(require('markdown-it-deflist')) // per pandoc format http://pandoc.org/MANUAL.html#definition-lists
      .use(require('markdown-it-emoji')) // all github emoji codes https://www.githubemojis.com/
      .use(require('markdown-it-mark')); // allows ==text== format for <mark> tags (hilighting)
  },
};

const mdi = require('../config-markdown-it.js')(rcOptions);
const mdi2 = require('../config-markdown-it.js')(rcOptions);

test('mdi only configs once', () => {
  expect(mdi).toEqual(mdi2);
});

test('block rendering', () => {
  expect(mdi.render('hello __world__')).toMatchSnapshot();
});

test('inline rendering', () => {
  expect(mdi.renderInline('hello __world__')).toMatchSnapshot();
});
