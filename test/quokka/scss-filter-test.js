const Sass = require('node-sass');

const test = Sass.renderSync({
  data: `$color: red;`,
  file: 'body { background-color: $color; }',
}).css;

console.log(test.toString());
