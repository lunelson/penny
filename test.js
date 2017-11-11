// const { readFile } = require('fs');
// const { relative, dirname, join } = require('path');
// const filename = join(__dirname, 'subdir');
// console.log(filename);
// readFile(filename, 'utf-8', (err, data) => {
//   if (!data) { console.log('no file found'); }
//   if (data) {
//     console.log(data.toString());
//   }
// });

// const test = { a: 'b ' };

// const dirlog = require('./other/nest.js');
// dirlog();

const pug = require('pug');
const pugString = 'h1 hello world';
const render = new Promise((resolve, reject) => {
  pug.render(pugString, { doctype: 'html', cache: false }, function(err, data) {
    if (err != null) return reject(err);
    return resolve(data);
  });
});

render
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    const { msg, filename, line, column } = err;
    console.log(`${msg} in ${filename}, ${line}:${column}`);
  });
