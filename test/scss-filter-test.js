const Sass = require('node-sass');

const test = Sass.renderSync({
  data: `
$color: blue;
body { background-color: $color; }
  `}).css;

console.log(test.toString());
