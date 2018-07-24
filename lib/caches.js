// node
const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');

// npm
const _ = require('lodash');
const UrlPattern = require('url-pattern');
const grayMatter = require('gray-matter');
const readData = require('read-data');
const loadCSV = require('csv-load-sync');
const MemoryFS = require('memory-fs'); // https://github.com/webpack/memory-fs

// local
const { removeExt } = require('./misc-penny.js');

//
// $data, $dataSyncer
//

const $data = Object.create(null);

function $dataSyncer(srcDir) {
  return function(event, file) {
    const dataFile = join(srcDir, file);
    const dataPath = removeExt(file).split('/');
    const dataExt = extname(file);
    const data = dataExt == '.js' ?
      require(dataFile) :
      dataExt == '.csv' ?
        loadCSV(dataFile) :
        readData.sync(dataFile);
    dataPath[0] == '_data' && dataPath.shift();
    if (!(event == 'unlink')) _.set($data, dataPath, data);
    else {
      _.unset($data, dataPath);
      while (--dataPath.length && _.isEmpty(_.get($data, dataPath))) {
        _.unset($data, dataPath);
      }
    }
  };
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
  memoryFs: new MemoryFS(),
  bundleCache: Object.create(null)
};
