var filterFiles = require('filter-files');

const listA = filterFiles.sync('./test', (path) => {
  return /\.pug$/.test(path);
}); //?

const listB = filterFiles.sync('./test', (path) => {
  return /\.scss$/.test(path);
}); //?

/*
  - for each srcExt, get the srcFiles
  - copy all the non-src files to destination (use srcFiles as exclusion)
    NB: _.without(array, ...values) will return all the files which are not being processed
  - pass each array of srcFiles through its renderer, to destination

  Q: how best to copy an arbitrary path to a new relative path ??

*/
