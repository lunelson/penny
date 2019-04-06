//                _       _                          _
//               | |     | |                        | |
// __      ____ _| |_ ___| |__ ______ _ __ ___   ___| |_ __ _
// \ \ /\ / / _` | __/ __| '_ \______| '_ ` _ \ / _ \ __/ _` |
//  \ V  V / (_| | || (__| | | |     | | | | | |  __/ || (_| |
//   \_/\_/ \__,_|\__\___|_| |_|     |_| |_| |_|\___|\__\__,_|

// built-in
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

const { dataLogger } = require('./util-loggers');

function removeExt(str) { const extIndex = str.lastIndexOf('.'); return ~extIndex ? str.slice(0, extIndex) : str; }

const $data = Object.create(null);
$data._errors = new Map();

function watchData(options, onEvent) {
  const { srcDir } = options;
  return new Promise((resolve, reject) => {
    try {
      const watcher = chokidar
        .watch(['_data/**/*.(js|json|json5|toml|yml|yaml|csv|tsv)'], { cwd: srcDir })
        .on('all', (fileEvent, relFile) => {

          dataLogger.debug(`${fileEvent} $data: ${relFile}`);

          const dataFile = join(srcDir, relFile);
          const dataFileExt = extname(relFile);

          const valuePath = removeExt(relFile).split('/');
          valuePath[0] == '_data' && valuePath.shift();

          // get the data
          let value;
          try {
            if (dataFileExt == '.js') { delete require.cache[dataFile]; value = require(dataFile); }
            else { value = dataFileExt == '.csv' ? loadCSV(dataFile) : readData.sync(dataFile); }
            $data._errors.delete(dataFile);
          } catch (err) {
            dataLogger.error(err.toString());
            value = err.toString();
            $data._errors.set(dataFile, err);
          }

          // set the data
          if ((fileEvent != 'unlink')) _.set($data, valuePath, value);
          else {
            _.unset($data, valuePath);
            while (--valuePath.length && _.isEmpty(_.get($data, valuePath))) {
              _.unset($data, valuePath);
            }
          }

          // run the callback
          onEvent && onEvent(fileEvent, relFile);
        });

      watcher.on('ready', () => resolve(watcher));
    } catch(err) {
      reject(err);
    }
  });
}

module.exports = { $data, watchData };
