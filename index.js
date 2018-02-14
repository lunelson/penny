const cosmiconfig = require('cosmiconfig');

const doServe = require('./lib/serve');
const doBuild = require('./lib/build');

const stopDir = process.cwd();
const rcLoader = cosmiconfig('penny', { stopDir, rcExtensions: true })
  .load(stopDir)
  .then((result) => result ? result.config : Object.create(null));

const rcDefaults = {
  // linting: false,
  // caching: true, // hook this up to the caching in serve.js
  // data: '', // WIP; could also be called 'locals'
  browsers: ['>1%'],
  eslint: false,
  // stylelint: false,
  reqSrcExt: { // sourceTypes | sources | sourceMatching
    '.html': '.pug',
    '.css': '.scss',
    '.js': '.js'
  }
};

function rcCombine(defaults, options) {
  return Object.assign(defaults, options);
}

function serve(srcDir, isDev) {
  rcLoader.then((rcOptions) => {
    doServe(srcDir, isDev, rcCombine(rcDefaults, rcOptions));
  });
}

function build(srcDir, outDir) {
  rcLoader.then((rcOptions) => {
    doBuild(srcDir, outDir, rcCombine(rcDefaults, rcOptions));
  });
}

module.exports = { serve, build };
