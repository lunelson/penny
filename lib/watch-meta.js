//                _       _                          _
//               | |     | |                        | |
// __      ____ _| |_ ___| |__ ______ _ __ ___   ___| |_ __ _
// \ \ /\ / / _` | __/ __| '_ \______| '_ ` _ \ / _ \ __/ _` |
//  \ V  V / (_| | || (__| | | |     | | | | | |  __/ || (_| |
//   \_/\_/ \__,_|\__\___|_| |_|     |_| |_| |_|\___|\__\__,_|

// node
const { extname, join, basename } = require('path');
const { readFileSync } = require('fs');

// npm
const _ = require('lodash');
const chokidar = require('chokidar');
const anymatch = require('anymatch');
const grayMatter = require('gray-matter');
const readData = require('read-data');
const loadCSV = require('csv-load-sync');
const junk = require('junk');

// local
const { pennyLogger } = require('./loggers');
const { removeExt, dataGlob, htmlSrcGlob, fileEventNames } = require('./misc-penny.js');

//
// $data, dataWatch
//

const $data = Object.create(null);

function dataWatch(srcDir) {
  return function(onReady, onEvent) {

    // init watcher
    const watcher = chokidar.watch([dataGlob], { cwd: srcDir });

    // set ready listener to pass the watcher through
    watcher.on('ready', () => onReady(watcher));

    // set main listener
    watcher.on('all', (fsEvent, relFile) => {

      // process ->
      pennyLogger.debug(`${fsEvent} $data: ${relFile}`);
      const dataFile = join(srcDir, relFile);
      const dataPath = removeExt(relFile).split('/');
      const dataExt = extname(relFile);

      // get the data
      let data;
      try {
        if (dataExt == '.js') { delete require.cache[dataFile]; data = require(dataFile); }
        else { data = dataExt == '.csv' ? loadCSV(dataFile) : readData.sync(dataFile); }
      } catch (err) {
        pennyLogger.error(err.toString());
        data = err.toString();
      }

      // set the data
      dataPath[0] == '_data' && dataPath.shift();
      if ((fsEvent != 'unlink')) _.set($data, dataPath, data);
      else {
        _.unset($data, dataPath);
        while (--dataPath.length && _.isEmpty(_.get($data, dataPath))) {
          _.unset($data, dataPath);
        }
      }

      // run the callback
      onEvent && onEvent(fsEvent, relFile);
    });

    // return the watcher instance
    return watcher;
  };
}

//
// $pages, pageWatch
//

const $pages = Object.create(null);

function pageWatch(pubDir) {
  return function(onReady, onEvent) {

    // init watcher
    // -- TODO: review; disallow only _file, not _folder/file ?
    const watcher = chokidar.watch([htmlSrcGlob], { ignored: ['**/node_modules/**', '_data/**', '**/_*.*'], cwd: pubDir });

    // set ready listener
    watcher.on('ready', () => onReady(watcher));

    // set main listener
    watcher.on('all', (fsEvent, relFile) => {

      // return early if not qualified
      if (anymatch([junk.regex], basename(relFile))) return;
      if (!~fileEventNames.indexOf(fsEvent)) return;

      // process ->
      pennyLogger.debug(`${fsEvent} $page: ${relFile}`);
      const pathname = '/'+relFile.replace(/\.(pug|md)$/, '.html');
      if (fsEvent == 'unlink') return delete $pages[pathname];
      const filename = join(pubDir, relFile);

      // get the data
      let data;
      try {
        data = grayMatter(readFileSync(filename, 'utf8')).data;
      } catch (error) {
        pennyLogger.error(error.toString());
        data = error.toString();
      }

      // set the data
      $pages[pathname] = Object.assign({ pathname }, data);

      // run the callback
      onEvent && onEvent(fsEvent, relFile);
    });

    // return the watcher instance
    return watcher;
  };
}

module.exports = { $data, dataWatch, $pages, pageWatch };
