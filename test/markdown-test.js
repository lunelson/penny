const pug = require('pug');
const markdown = require('markdown-it')({ breaks: true });

const opts = {
  filters: {
    markdown(text, opts) {
      return markdown.render(text, { breaks: false });
    }
  }
};

pug.render(`

h1 hello
  :markdown
    world
    again

`, opts); //?

markdown.render(`

something
else

`); //?
