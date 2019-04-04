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
