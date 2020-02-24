const fs = require('fs');

require('json5/lib/register'); // adds json5 parsing via require.extensions API !

const yaml = require('js-yaml');
const toml = require('toml');
const csvParse = require('csv-parse/lib/sync');

/**
 *      _       _
 *     | |     | |
 *   __| | __ _| |_ __ _
 *  / _` |/ _` | __/ _` |
 * | (_| | (_| | || (_| |
 *  \__,_|\__,_|\__\__,_|
 *
 * LIBS:
 * json5 https://json5.org/
 * toml https://binarymuse.github.io/toml-node/
 * yaml/yml http://nodeca.github.io/js-yaml/
 * csv/tsv https://csv.js.org/parse/api/#sync-api
 *
 * MAYBE:
 * parse JSON and JSON5 manually rather than requiring
 * https://github.com/sindresorhus/parse-json
 *
 * - review what happens when subfunctions Error here
 *  - consider how to differentiate formatting / filename Errors here from other points in chain
 * - console.error the received error ? AND
 * - throw a new Error(penny/path/to/module)
 * - err.name, err.code and err.message should be standard, if the thrown Exception *is* an instance of Error
 */

module.exports = function readData(absFile) {
  // if js|json|json5 -> require
  if (absFile.match(/\.(js|json5?)$/)) {
    delete require.cache[absFile];
    return require(absFile);
  }
  // read in data; if length 0 -> return {}
  const data = fs.readFileSync(absFile, 'utf8');
  if (!data.length) return {};
  // if yml|yaml -> delegate
  const yamlMatch = absFile.match(/\.ya?ml$/);
  if (yamlMatch) return yaml.safeLoad(data);
  // if toml -> delegate
  const tomlMatch = absFile.match(/\.toml$/);
  if (tomlMatch) return toml.parse(data);
  // if csv|tsv -> delegate
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
};
