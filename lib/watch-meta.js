// node
const { extname, join, basename } = require('path');
const { readFileSync } = require('fs');

// npm
const _ = require('lodash');
const anymatch = require('anymatch');
const grayMatter = require('gray-matter');
const readData = require('read-data');
const loadCSV = require('csv-load-sync');

// local
const { pennyLogger } = require('./loggers');
const { removeExt, bsync, dataGlob, htmlSrcGlob, fileEventNames } = require('./misc-penny.js');

//
// $data, $dataSyncer
//

const $data = Object.create(null);

function $dataSyncer(srcDir) {
  return function(event, file) {
    const dataFile = join(srcDir, file);
    const dataPath = removeExt(file).split('/');
    const dataExt = extname(file);

    // get it
    let data;
    try {
      if (dataExt == '.js') { delete require.cache[dataFile]; data = require(dataFile); }
      else { data = dataExt == '.csv' ? loadCSV(dataFile) : readData.sync(dataFile); }
    } catch (err) {
      pennyLogger.error(err.toString());
      data = err.toString();
    }

    // set it
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

    // get it
    let data;
    try {
      data = grayMatter(readFileSync(filename, 'utf8')).data;
    } catch (error) {
      pennyLogger.error(error.toString());
      data = error.toString();
    }

    // set it
    const $page = Object.assign({ pathname }, data);
    return $pages[pathname] = $page;
  };
}

function dataWatch(baseDir) {
  const dataTreeSync = $dataSyncer(baseDir);
  console.dir({dataGlob});
  return function(onReady, onEvent) {
    return bsync.watch([dataGlob], {
      cwd: baseDir
    }, (fsEvent, relFile) => {
      pennyLogger.debug(`${fsEvent} $data: ${relFile}`);
      dataTreeSync(fsEvent, relFile);
      onEvent && onEvent(fsEvent, relFile);
    }).on('ready', onReady);
  };
}

function pageWatch(baseDir) {
  const pagesMapSync = $pagesSyncer(baseDir);
  return function(onReady, onEvent) {
    return bsync.watch([htmlSrcGlob], {
      // TODO: review; disallow only _file, not _folder/file ?
      ignored: ['**/node_modules/**', '_data/**', '**/_*.*'],
      cwd: baseDir
    }, (fsEvent, relFile) => {
      if (anymatch([junk.regex], basename(relFile))) return;
      if (!~fileEventNames.indexOf(fsEvent)) return;
      pennyLogger.debug(`${fsEvent} $page: ${relFile}`);
      pagesMapSync(fsEvent, relFile);
      onEvent && onEvent(fsEvent, relFile);
    }).on('ready', onReady);
  };
}
