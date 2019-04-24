/**
 *                _       _              _       _
 *               | |     | |            | |     | |
 * __      ____ _| |_ ___| |__ ______ __| | __ _| |_ __ _
 * \ \ /\ / / _` | __/ __| '_ \______/ _` |/ _` | __/ _` |
 *  \ V  V / (_| | || (__| | | |    | (_| | (_| | || (_| |
 *   \_/\_/ \__,_|\__\___|_| |_|     \__,_|\__,_|\__\__,_|
 *
 *
 */

const path = require('path');
const __basename = path.basename(__filename);

const chokidar = require('chokidar');
const _ = require('lodash');
const anymatch = require('anymatch');
const junk = require('junk');
const changeCase = require('change-case');

const { pennyLogger } = require('./util-loggers');
const { removeExt } = require('./util-general');
const { readData } = require('./util-data');

const $data = {};
const valuePaths = new Set();

function watchData(options, onChange) {
  const { srcDir, onParse } = options;
  const dataDir = path.join(srcDir, '_data');
  options.$data = $data;

  return new Promise((resolve, reject) => {
    try {
      const watcher = chokidar
        /**
         * watch only data files under @/_data
         */
        .watch(['**/*.(js|json|json5|toml|yaml|yml|csv|tsv)'], {
          ignored: ['**/node_modules/**'],
          cwd: dataDir,
        })
        .on('all', (fileEvent, relFile) => {
          /**
           * if junk file, return
           * if irrelevant event, return
           */
          if (anymatch([junk.regex], path.basename(relFile))) return;
          if (!~['change', 'add', 'unlink'].indexOf(fileEvent)) return;
          /**
           * resolve absFile wrt dataDir
           * resolve valuePath from relFile
           * let currentErr
           */
          const absFile = path.join(dataDir, relFile);
          const valuePath = removeExt(relFile)
            .split('/')
            .map(slug => changeCase.camel(slug));
          let currentErr = null;
          /**
           * if unlink, unset value in $data at valuePath
           */
          if (fileEvent == 'unlink') {
            _.unset($data, valuePath);
            valuePaths.delete(valuePath.join('.'));
            while (--valuePath.length && _.isEmpty(_.get($data, valuePath))) {
              _.unset($data, valuePath);
            }
          } else {
            /**
             * else try to read data
             */
            try {
              const value = readData(absFile);
              _.set($data, valuePath, value);
              valuePaths.add(valuePath.join('.'));
            } catch (err) {
              currentErr = err;
              pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
            }
          }
          pennyLogger.debug(`data: ${fileEvent}: ${relFile} \n$data paths:`, [...valuePaths.keys()]);
          /**
           * run onParse and onChange
           */
          onParse(currentErr, absFile);
          fileEvent == 'change' && onChange(currentErr, absFile);
        });

      watcher.on('ready', () => resolve(watcher));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  $data,
  readData,
  watchData,
};