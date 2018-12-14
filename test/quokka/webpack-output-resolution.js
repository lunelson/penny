const path = require('path');
const { resolve, dirname, basename, relative } = require('path');
const pubDir = '/foo/bar';

const files = ["main.js", "scss/config.js", "pug/read-sources/something.js"];

files
  // .map(file => `./${file}`)
  .map(file => path.resolve(__dirname, file))
  .map(file => path.dirname(file)) //?

// entry
files.map(file => `./${file}`) //?

// path
files.map(file => dirname(resolve(pubDir, file))) //?

// filename
files.map(file => basename(file)) //?

// publicPath
files.map(file => dirname(resolve('/', file)).replace(/([^/])$/,'$1/')) //?
