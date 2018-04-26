const cosmiconfig = require('cosmiconfig');

const doServe = require('./lib/serve');
const doBuild = require('./lib/build');

// const stopDir = process.cwd();
const rcLoader = cosmiconfig('penny', { stopDir: process.cwd(), rcExtensions: true });

// function rcCombine(defaults, options) {
//   return Object.assign(defaults, options);
// }

/*
TODO: potential options

linting: true, // globally disable eslint + stylelint
caching: true, // whether serve.js should use the renderCache
data: '', // WIP; could also be called 'locals'
stylelint: false,

*/

const options = {
  browsers: ['>1%'],
  eslint: false,
  logLevel: 'warn',
  reqSrcExt: { // TODO: pluralize
    '.html': '.pug',
    '.css': '.scss',
    '.js': '.js'
  },
};

function serve(srcDir) {
  rcLoader
    .load(srcDir)
    .then((result) => result ? result.config : Object.create(null))
    .then((rcOptions) => {
      Object.assign(options, rcOptions, { isDev: process.env.NODE_ENV != 'production', isBuild: false});
      doServe(srcDir, options);
    });
}

function build(srcDir, outDir) {
  rcLoader
    .load(srcDir)
    .then((result) => result ? result.config : Object.create(null))
    .then((rcOptions) => {
      Object.assign(options, rcOptions, { isDev: process.env.NODE_ENV == 'development', isBuild: true});
      doBuild(srcDir, outDir, options);
    });
}

module.exports = { serve, build };
