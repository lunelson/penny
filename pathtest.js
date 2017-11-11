const path = require('path');

console.log(path.resolve(__dirname));
console.log(path.resolve(__filename));
console.log(path.join(__dirname, path.resolve('/dir/of/this/file', '/foo/bar.jpg')));
console.log(path.join(__dirname, path.resolve('/dir/of/this/file', './foo/bar.jpg')));
