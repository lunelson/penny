/**
 *        _   _ _           _       _
 *       | | (_) |         | |     | |
 *  _   _| |_ _| |______ __| | __ _| |_ __ _
 * | | | | __| | |______/ _` |/ _` | __/ _` |
 * | |_| | |_| | |     | (_| | (_| | || (_| |
 *  \__,_|\__|_|_|      \__,_|\__,_|\__\__,_|
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

const fs = require('fs');

require('json5/lib/register');
const yaml = require('js-yaml');
const toml = require('toml');
const csvParse = require('csv-parse/lib/sync');

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

module.exports = {
  readData,
};
