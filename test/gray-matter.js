const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

console.log(path.resolve(__dirname, '../test-src/matter.pug'));

const str = fs.readFileSync(path.resolve(__dirname, '../test-src/matter.pug'), 'utf8');

/*
  data
  content
  excerpt
  empty
  isEmpty
*/

const { data: srcData, content: srcContent } = matter(str);
console.log({ srcData, srcContent });
