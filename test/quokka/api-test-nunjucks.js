const Nunjucks = require('nunjucks');

const njkEnv = Nunjucks.configure(__dirname, {
  noCache: true,
  trimBlocks: false,
  lstripBlocks: false,
});

const njkString = `
<p>{{ username }}</p>
{% include "test-file.njk" %}
`;

const depFiles = [];

depFiles.length = 0;

njkEnv.on('load', (name, source, loader) => {
  depFiles.push(source.path);
  // console.log(name);
  // console.log(source);
  // console.log(loader);
})

const template = Nunjucks.compile(njkString, njkEnv, __filename);

depFiles;

// Object.keys(template); //?

// template.compiled //?
// template.tmplStr //?
// template.path //?
// Object.keys(template.env) //?

// template.env.extensions; //?
// template.env.extensionsList; //?
// template.env.loaders; //?

template.render({ username: 'James' }); //?

depFiles;
