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

const rcLoaders = [];

function rcCombine(options, rcOptions) {
  // ... combine the rcOptions in to the main options object
  return options;
}

function serve(baseDir, isDev, options/* , cb */) {
  Promise.all(rcLoaders).then((rcOptions) => {
    // serve that shit
    doServe(baseDir, isDev, rcCombine(options, rcOptions));
  });
}

function build(baseDir, outDir, options/* , cb */) {
  Promise.all(rcLoaders).then((rcOptions) => {
    // build that shit
    doBuild(baseDir, outDir, rcCombine(options, rcOptions));

  });
}

module.exports = { serve, build };
