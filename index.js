const cosmiconfig = require('cosmiconfig');

const doServe = require('./lib/serve');
const doBuild = require('./lib/build');

// const stopDir = process.cwd();
const rcLoader = cosmiconfig('penny', { stopDir: process.cwd(), rcExtensions: true });

function rcCombine(defaults, options) {
  return Object.assign(defaults, options);
}

const rcDefaults = {
  browsers: ['>1%'],
  eslint: false,
  reqSrcExt: { // TODO: pluralize
    '.html': '.pug',
    '.css': '.scss',
    '.js': '.js'
  },

  /*
  TODO: potential options

  linting: true, // globally disable eslint + stylelint
  caching: true, // whether serve.js should use the renderCache
  data: '', // WIP; could also be called 'locals'
  stylelint: false,

  */
};

function serve(srcDir, isDev) {
  rcLoader
    .load(srcDir)
    .then((result) => result ? result.config : Object.create(null))
    .then((rcOptions) => {
      doServe(srcDir, isDev, rcCombine(rcDefaults, rcOptions));
    });
}

function build(srcDir, outDir) {
  rcLoader
    .load(srcDir)
    .then((result) => result ? result.config : Object.create(null))
    .then((rcOptions) => {
      doBuild(srcDir, outDir, rcCombine(rcDefaults, rcOptions));
    });
}

module.exports = { serve, build };
