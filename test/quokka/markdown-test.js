const mdi = require('../../lib/config-md.js')();
const mdi2 = require('../../lib/config-md.js')();


mdi.render('hello'); //?
mdi.renderInline('hello'); //?

mdi2.render('hello'); //?
mdi2.renderInline('hello'); //?

mdi == mdi2; //?
// const pug = require('pug');
// const markdown = require('markdown-it')({ breaks: true });

// const opts = {
//   filters: {
//     markdown(text, opts) {
//       return markdown.render(text, { breaks: false });
//     }
//   }
// };

// pug.render(`

// h1 hello
//   :markdown
//     world
//     again

// `, opts); //?

// markdown.render(`

// something
// else

// `); //?
