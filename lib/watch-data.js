const fs = require('fs');
const path = require('path');
const __basename = path.basename(__filename);

require('json5/lib/register');
const yaml = require('js-yaml');
const toml = require('toml');
const csvParse = require('csv-parse/lib/sync');
const chokidar = require('chokidar');
const _ = require('lodash');
const anymatch = require('anymatch');
const grayMatter = require('gray-matter');
const junk = require('junk');
const changeCase = require('change-case');

const { pennyLogger } = require('./util-loggers');
const { outSrcExts, fileEventNames, removeExt } = require('./util-general');

/**
 *      _       _
 *     | |     | |
 *   __| | __ _| |_ __ _
 *  / _` |/ _` | __/ _` |
 * | (_| | (_| | || (_| |
 *  \__,_|\__,_|\__\__,_|
 *
 * LIBS:
 *
 * json5 https://json5.org/
 * toml https://binarymuse.github.io/toml-node/
 * yaml/yml http://nodeca.github.io/js-yaml/
 * csv/tsv https://csv.js.org/parse/api/#sync-api
 *
 * MAYBE:
 * parse JSON and JSON5 manually rather than requiring
 * https://github.com/sindresorhus/parse-json
 *
 * TODO:
 * - console.error the received error ?
 * - throw a new Error(penny/path/to/module)
 * - err.name, err.code and err.message should be standard, if the thrown Exception *is* an instance of Error
 */

function readData(filePath) {
  const absFile = require.resolve(filePath);

  // readFile and check if empty -> return empty Object
  const data = fs.readFileSync(absFile, 'utf8');
  if (!data.length) return {};

  if (absFile.match(/\.(js|json5?)$/)) {
    delete require.cache[absFile];
    return require(absFile);
  }

  const yamlMatch = absFile.match(/\.ya?ml$/);
  if (yamlMatch) return yaml.safeLoad(data);

  const tomlMatch = absFile.match(/\.toml$/);
  if (tomlMatch) return toml.parse(data);

  const csvMatch = absFile.match(/\.(c|t)sv$/);
  if (csvMatch)
    return csvParse(data, {
      delimiter: csvMatch[0] == '.csv' ? ',' : '\t',
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      skip_lines_with_error: true,
      // skip_lines_with_empty_values: true,
    });
}

const $data = {};
$data.__errors = new Map();
$data.__paths = new Set();

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
          if (!~fileEventNames.indexOf(fileEvent)) return;
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
            $data.__paths.delete(valuePath.join('.'));
            while (--valuePath.length && _.isEmpty(_.get($data, valuePath))) {
              _.unset($data, valuePath);
            }
          } else {
            /**
             * else try to read data
             */
            // let value = null;
            try {
              const value = readData(absFile);
              _.set($data, valuePath, value || {});
              $data.__paths.add(valuePath.join('.'));
            } catch (err) {
              currentErr = err;
              pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
            }
          }
          pennyLogger.debug(`data: ${fileEvent}: ${relFile} \n$data paths:`, [...$data.__paths.keys()]);
          /**
           * run onParse and onEvent
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
