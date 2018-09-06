// node
const { relative, extname, join, resolve, dirname, basename } = require('path');
const { stat, readFileSync } = require('fs');

// npm
const _ = require('lodash');
const grayMatter = require('gray-matter');
const readData = require('read-data');
const loadCSV = require('csv-load-sync');

// local
const { pennyLogger } = require('./loggers');
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
    let data;
    if (dataExt == '.js') {
      delete require.cache[dataFile];
      data = require(dataFile);
    } else {
      try {
        data = dataExt == '.csv' ? loadCSV(dataFile) : readData.sync(dataFile);
      } catch (error) {
        pennyLogger.error(error.toString());
        data = error.toString();
      }
    }
    dataPath[0] == '_data' && dataPath.shift();
    if ((event != 'unlink')) _.set($data, dataPath, data);
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

const $pages = Object.create(null);

function $pagesSyncer(srcDir) {
  return function(event, relFile) {
    const pathname = '/'+relFile.replace(/\.(pug|md)$/, '.html');
    if (event == 'unlink') return delete $pages[pathname];
    const filename = join(srcDir, relFile);
    let data;
    try {
      data = grayMatter(readFileSync(filename, 'utf8')).data;
    } catch (error) {
      pennyLogger.error(error.toString());
      data = error.toString();
    }
    const $page = Object.assign({ pathname }, data);
    return $pages[pathname] = $page;
  };
}

module.exports = {
  $data,
  $dataSyncer,
  $pages,
  $pagesSyncer,
};
