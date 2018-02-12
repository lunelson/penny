'use-strict';

const filterFiles = require('filter-files');

module.exports = function (srcDir, outDir, options) {
  const isDev = false;

  console.log(`
    BUILD
    from: ${srcDir}
    to:   ${outDir}
  `);

  const pugFiles = filterFiles.sync(srcDir, function(fp, dir, files, recurse) { return /\.pug$/.test(fp); }, true);
  const scssFiles = filterFiles.sync(srcDir, function(fp, dir, files, recurse) { return /\.scss$/.test(fp); }, true);
  const jsFiles = filterFiles.sync(srcDir, function(fp, dir, files, recurse) { return /\.js$/.test(fp); }, true);

  console.log({pugFiles, jsFiles});

};
