const { readFile } = require('fs');
const { relative, dirname, join } = require("path");
const filename = join(__dirname, 'subdir');
console.log(filename);
readFile(filename, 'utf-8', (err, data) => {
  if (!data) { console.log('no file found'); }
  if (data) {
    console.log(data.toString());
  }
});

const test = { a: "b " };

const dirlog = require("./other/nest.js");
dirlog();