const fs = require('fs');
const path = require('path');

// JSON5
// https://json5.org/
// https://github.com/json5/json5
require('json5/lib/register');

// TOML
// https://binarymuse.github.io/toml-node/
// https://github.com/BinaryMuse/toml-node
const toml = require('toml');

// YAML
// http://nodeca.github.io/js-yaml/
// https://github.com/nodeca/js-yaml
const yaml = require('js-yaml');

// CSV
// https://csv.js.org/convert/
// https://csv.js.org/parse/api/#sync-api
// alternative https://github.com/mafintosh/csv-parser
const csvParse = require('csv-parse/lib/sync')

// console.log(require.resolve.paths('./foo/bar.js')[0])

function readData(filePath) {
  try {
    // this might not be the best way to find the file,
    const absFile = require.resolve(filePath);

    if (absFile.match(/\.(js|json|json5)$/)) {
      delete require.cache[absFile]
      return require(absFile);
    }
    const data = fs.readFileSync(absFile, 'utf8');

    const yamlMatch = absFile.match(/\.ya?ml$/);
    if (yamlMatch) return yaml.safeLoad(data);

    const tomlMatch = absFile.match(/\.toml$/);
    if (tomlMatch) return toml.parse(data);

    const csvMatch = absFile.match(/\.(c|t)sv$/);
    if (csvMatch) return csvParse(data, {
      delimiter: csvMatch[0] == '.csv' ? ',' : '\t',
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      skip_lines_with_error: true,
      // skip_lines_with_empty_values: true,
    });
  } catch (err) {
    throw err;
  }
}

// readData('./test-file.js'); //?
typeof readData('./test-file.json'); //?
typeof readData('./test-file.json5'); //?
typeof readData('./test-file.toml'); //?
typeof readData('./test-file.yaml'); //?
typeof readData('./test-file.yml'); //?
typeof readData('./test-file.csv'); //?
typeof readData('./test-file.tsv'); //?
