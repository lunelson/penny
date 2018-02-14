/*
  INDEX

  - do the comsmiconfig stuff; build the options object
  - depending on the CLI args, execute build.js or serve.js
  - export a function which does what?
      module.exports = { serve, build };

      var penny = require("penny")
      penny.serve(baseDir, isDev, options [, cb])
      penny.build(baseDir, outDir, options [, cb])
*/

const doServe = require('./lib/serve');
const doBuild = require('./lib/build');

const rcLoaders = [Promise.resolve()]; // TBD
const rcDefaults = {}; // defaults

function rcCombine(defaults, options) {
  // ... combine the rcOptions in to the main rcDefaults object
  return defaults;
}

function serve(srcDir, isDev) {
  Promise.all(rcLoaders).then((rcOptions) => {
    console.log(`serving from ${srcDir}`);
    // doServe(srcDir, isDev, rcCombine(rcDefaults, rcOptions));
  });
}

function build(srcDir, outDir) {
  Promise.all(rcLoaders).then((rcOptions) => {
    doBuild(srcDir, outDir, rcCombine(rcDefaults, rcOptions));

  });
}

module.exports = { serve, build };
