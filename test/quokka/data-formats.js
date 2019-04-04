const fs = require('fs')

// JSON5
// https://github.com/json5/json5
require('json5/lib/register')
try {
  const json5Data = require('./test-file.json5') //?
} catch (err) {
  console.log(err);
}

// TOML
// https://binarymuse.github.io/toml-node/
// https://github.com/BinaryMuse/toml-node
var toml = require('toml');
try {
  var tomlData = toml.parse(fs.readFileSync(require.resolve('./test-file.toml'), 'utf8')); //?
} catch (err) {
  console.log(err);
}

// YAML
// http://nodeca.github.io/js-yaml/
// https://github.com/nodeca/js-yaml
yaml = require('js-yaml');
try {
  const yamlData = yaml.safeLoad(fs.readFileSync(require.resolve('./test-file.yaml'), 'utf8')); //?
} catch (err) {
  console.log(err);
}

// CSV
// https://csv.js.org/convert/
// https://csv.js.org/parse/api/#sync-api
// alternative https://github.com/mafintosh/csv-parser
const csvParse = require('csv-parse/lib/sync')
try {
  const csvData = csvParse(fs.readFileSync(require.resolve('./test-file.csv'), 'utf8'), {
    columns: true,
    delimiter: ',',
    relax_column_count: true,
    skip_lines_with_error: true,
    skip_empty_lines: true,
  }); //?
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
