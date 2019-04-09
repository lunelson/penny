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
const { outSrcExts, fileEventNames } = require('./util-general');

/**
 *      _       _
 *     | |     | |
 *   __| | __ _| |_ __ _
 *  / _` |/ _` | __/ _` |
 * | (_| | (_| | || (_| |
 *  \__,_|\__,_|\__\__,_|
 *
 * libraries used:
 * JSON5 https://json5.org/
 * TOML https://binarymuse.github.io/toml-node/
 * YAML http://nodeca.github.io/js-yaml/
 * CSV/TSV: https://csv.js.org/parse/api/#sync-api
 *
 * ERRORS TODO
 * console.error the received error ?
 * throw a new Error(penny/path/to/module)
 * err.name, err.code and err.message should be standard, if the thrown Exception *is* an instance of Error
 */

function readData(filePath) {
  const absFile = require.resolve(filePath);

  if (absFile.match(/\.(js|json5?)$/)) {
    delete require.cache[absFile];
    return require(absFile);
  }
  const data = fs.readFileSync(absFile, 'utf8');

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

function removeExt(str) {
  const extIndex = str.lastIndexOf('.');
  return ~extIndex ? str.slice(0, extIndex) : str;
}

const $data = {};
$data.__errors = new Map();
$data.__paths = new Set();

function watchData(options, onEvent) {
  const { srcDir, logLevel } = options;

  return new Promise((resolve, reject) => {
    try {
      const watcher = chokidar
        .watch(['_data/**/*.(js|json|json5|toml|yaml|yml|csv|tsv)'], { cwd: srcDir })
        .on('all', (fileEvent, relFile) => {
          if (!~fileEventNames.indexOf(fileEvent)) return;
          if (anymatch([junk.regex], path.basename(relFile))) return;

          const dataFile = path.join(srcDir, relFile);
          const dataPath = removeExt(relFile).split('/');
          dataPath[0] == '_data' && dataPath.shift();
          const valuePath = dataPath.map(slug => changeCase.camel(slug));

          let value;
          try {
            value = readData(dataFile);
            $data.__errors.delete(dataFile);
          } catch (err) {
            pennyLogger.error(`{red:${__basename}}: ${err.message}`);
            $data.__errors.set(dataFile, err.message);
          }

          if (fileEvent != 'unlink') {
            _.set($data, valuePath, value);
            $data.__paths.add(valuePath.join('.'));
          } else {
            _.unset($data, valuePath);
            $data.__paths.delete(valuePath.join('.'));
            while (--valuePath.length && _.isEmpty(_.get($data, valuePath))) {
              _.unset($data, valuePath);
            }
          }

          pennyLogger.debug(`{yellow:${__basename}}: $data; ${fileEvent}: ${relFile}\n$data paths:`, [
            ...$data.__paths.keys(),
          ]);

          onEvent && onEvent(fileEvent, relFile);
        });

      watcher.on('ready', () => resolve(watcher));
    } catch (err) {
      reject(err);
    }
  });
}

const $routes = {};
$routes.__errors = new Map();

function watchRoutes(options, onEvent) {
  const { pubDir } = options;

  return new Promise((resolve, reject) => {
    try {
      const htmlExtGlob = outSrcExts['.html'].map(ext => ext.slice(1)).join('|');
      const watcher = chokidar
        .watch([`**/*.(${htmlExtGlob})`], {
          ignored: ['**/node_modules/**', '_data/**', '**/_*.*'],
          cwd: pubDir,
        })
        .on('all', (fileEvent, relFile) => {
          if (!~fileEventNames.indexOf(fileEvent)) return;
          if (anymatch([junk.regex], path.basename(relFile))) return;

          const route = '/' + relFile.replace(new RegExp(`\\.(${htmlExtGlob})$`), '.html');
          if (fileEvent == 'unlink') return delete $routes[route];
          const filename = path.join(pubDir, relFile);

          let data;
          try {
            data = grayMatter(fs.readFileSync(filename, 'utf8')).data;
            data.slug = data.slug || path.basename(relFile, path.extname(relFile));
            data.title =
              data.title ||
              changeCase.title(
                route
                  .replace(/\.html$/, '')
                  .split('/')
                  .join(' '),
              );
            $routes.__errors.delete(filename); // remove error entry for this file
          } catch (err) {
            pennyLogger.error(err.toString());
            data = err.toString();
            $routes.__errors.set(filename, err);
          }

          if (fileEvent != 'unlink') {
            $routes[route] = Object.assign({ route }, data);
          } else {
            delete $routes[route];
          }

          pennyLogger.debug(`{yellow:${__basename}}: $routes; ${fileEvent}: ${relFile}\n$route data:`, data);

          onEvent && onEvent(fileEvent, relFile);
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
  $routes,
  watchRoutes,
};
