const path = require('path');
const pug = require('pug');
const grayMatter = require('gray-matter');
const stripIndent = require('strip-indent');

const mdi = require('../../lib/config-markdown-it')();

const testStr = `
cat

[[[ +pug-test-mixin({ foo: bar }).large.right ]]]

dog

[[[
  +pug-test-mixin({ foo: bar })
    span this is inside the mixin
  h2 some more pug stuff could go here
]]]

dog

`;

// /\[\[\[([\s\S]+?)\]\]\]/gm.test(testStr); //?
// /\[\[\[([\s\S]+?)\]\]\]/gm.exec(testStr); //?
// testStr.match(/\[\[\[([\s\S]+?)\]\]\]/gm); //?

const { content } = grayMatter(testStr);

const mdStr = content.replace(/\[\[\[([\s\S]+?)\]\]\]/gm, (match, group, offset, src) => {
  return pug.render(`include ./markdown-pug-mixins.pug\n${stripIndent(group)}`, { filename: __filename });
}); //?

mdi.render(mdStr); //?
/*
  evaluate a pug string, in context of a mixins file
  - allow `mixins` as a key in the markdown file

 */
