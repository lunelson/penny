//                     _                  _
//                    | |                (_)
//  _ __ ___ _ __   __| | ___ _ __ ______ _ ___
// | '__/ _ \ '_ \ / _` |/ _ \ '__|______| / __|
// | | |  __/ | | | (_| |  __/ |         | \__ \
// |_|  \___|_| |_|\__,_|\___|_|         | |___/
//                                      _/ |
//                                     |__/

// node

// npm

// local

module.exports = function(baseDir, isDev, options) {
  const doLinting = options.eslint && options.eslintOptions;
  return function(srcFile, renderTimes, bundleCache) {
    return !doLinting ? Promise.resolve() : new Promise((resolve, reject) => {
      // linting resolve/reject
    })
      .then((value) => new Promise((resolve, reject) => {
        // rollup parsing
      }))
      .then((bundle) => new Promise((resolve, reject) => {
        // set cache
        // set rendertime
        // return bundle.generate(...)

      }))
      .catch((err) => {
        // log
        // set renderTime
        // return err;
      });
  };
};
