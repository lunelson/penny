// node
const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');

// npm
const _ = require('lodash');
const UrlPattern = require('url-pattern');
const grayMatter = require('gray-matter');
const readData = require('read-data');
const MemoryFS = require('memory-fs'); // https://github.com/webpack/memory-fs

// local
const { removeExt } = require('./misc-penny.js');

//
// $data, $dataSyncer
//

const $data = Object.create(null);

// TODO: use this function, to replace the generic data syncer
function $dataSyncer(srcDir) {
  return function(event, file) {
    const dataFile = join(srcDir, file);
    const dataPath = removeExt(file).split('/');
    const data = extname(file) == '.js' ? require(dataFile) : readData.sync(dataFile);
    dataPath[0] == '_data' && dataPath.shift();
    if (!(event == 'unlink')) return _.set($data, dataPath, data);
    _.unset($data, dataPath);
    while (--dataPath.length && _.isEmpty(_.get($data, dataPath))) {
      _.unset($data, dataPath);
    }
  };
}

function syncFileTree(obj, event, file, cb) {
  const dataPath = removeExt(file).split('/');
  dataPath[0] == '_data' && dataPath.shift();
  if (event == 'unlink') {
    _.unset(obj, dataPath);
    while (--dataPath.length && _.isEmpty(_.get(obj, dataPath))) {
      _.unset(obj, dataPath);
    }
  } else _.set(obj, dataPath, cb(file));
}

//
// $pages, $pagesSyncer
//

const $pages = new Map();

$pages.match = function(pattern){
  return Array.from(this.entries()).map(entry => {
    const match = new UrlPattern(`${pattern}(.html)`).match(entry[0]);
    return match ? Object.assign(entry[1], match) : null;
  }).filter(entry => entry);
};

function $pagesSyncer(srcDir) {
  return function(event, relFile) {
    const pathname = '/'+relFile.replace(/\.pug$/, '.html');
    if (event == 'unlink') return $pages.delete(pathname);
    const filename = join(srcDir, relFile);
    const { data } = grayMatter(readFileSync(filename, 'utf8'));
    const $page = Object.assign({ filename, pathname }, data);
    return $pages.set(pathname, $page);
  };
}

module.exports = {
  $data,
  $dataSyncer,
  $pages,
  $pagesSyncer,
  syncFileTree, // remove
  memoryFs: new MemoryFS(),
  bufferCache: Object.create(null)
};
