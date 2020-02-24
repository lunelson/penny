/*

errors
changes

track.js
  recentErrors
    Map, by compiler -> error
    NB: .delete before .set, to maintain insertion order

  recentChanges
    Set, of filenames
    NB: .delete before .add, to maintain insertion order


- send to errorStackSet
  error
  compiler
    srcExt
    srcFile
    outFile
    reqFile

- display error
  latestError
  recentChanges

 */

// map of 'webpack' -> error
exports.jsErrMap = new Map();
// map of compiler -> error
exports.srcErrMap = new Map();
// map of absFilePath -> error
exports.dataErrMap = new Map();

exports.fileChangeSet = new Set();

exports.srcCompilerMap = new Map();
exports.staticRouteMap = new Map();
exports.dynamicRouteMap = new Map();
