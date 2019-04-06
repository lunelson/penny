const fs = require('fs');
const path = require('path');

// JSON5
// https://github.com/json5/json5
require('json5/lib/register');

// TOML
// https://binarymuse.github.io/toml-node/
// https://github.com/BinaryMuse/toml-node
var toml = require('toml');

// YAML
// http://nodeca.github.io/js-yaml/
// https://github.com/nodeca/js-yaml
yaml = require('js-yaml');

// CSV
// https://csv.js.org/convert/
// https://csv.js.org/parse/api/#sync-api
// alternative https://github.com/mafintosh/csv-parser
const csvParse = require('csv-parse/lib/sync')

function readData(filePath) {
  if (filePath.match(/\.(js|json|json5)$/)) return require(filePath);
  try {
    const data = fs.readFileSync(require.resolve(filePath), 'utf8');

    const yamlMatch = filePath.match(/\.ya?ml$/);
    if (yamlMatch) return yaml.safeLoad(data);

    const tomlMatch = filePath.match(/\.toml$/);
    if (tomlMatch) return toml.parse(data);

    const csvMatch = filePath.match(/\.(c|t)sv$/);
    if (csvMatch) return csvParse(data, {
      columns: true,
      delimiter: csvMatch[0] == '.csv' ? ',' : '\t',
      relax_column_count: true,
      // skip_lines_with_empty_values: true,
      skip_lines_with_error: true,
      skip_empty_lines: true,
    });
  } catch (err) {
    throw err;
  }
}

// readData('./test-file.js'); //?
// readData('./test-file.json'); //?
readData('./test-file.json5'); //?
readData('./test-file.toml'); //?
readData('./test-file.yaml'); //?
readData('./test-file.yml'); //?
readData('./test-file.csv'); //?
readData('./test-file.tsv'); //?

try {
  const json5Data = require('./test-file.json5');
} catch (err) {
  console.log(err);
}

try {
  var tomlData = toml.parse(fs.readFileSync(require.resolve('./test-file.toml'), 'utf8'));
} catch (err) {
  console.log(err);
}

try {
  const yamlData = yaml.safeLoad(fs.readFileSync(require.resolve('./test-file.yaml'), 'utf8'));
} catch (err) {
  console.log(err);
}

try {
  const csvData = csvParse(fs.readFileSync(require.resolve('./test-file.csv'), 'utf8'), {
    columns: true,
    delimiter: ',',
    relax_column_count: true,
    // skip_lines_with_empty_values: true,
    skip_lines_with_error: true,
    skip_empty_lines: true,
  });
} catch (err) {
  console.log(err);
}

// const assert = require('assert')

// const input = `
// "key_1","key_2"
// "value 1","value 2"
// `
// const records = csvParse(input, {
//   columns: true,
//   skip_empty_lines: true
// })
// assert.deepEqual(records, [{ key_1: 'value 1', key_2: 'value 2' }])
