//        _   _ _
//       | | (_) |
//  _   _| |_ _| |___
// | | | | __| | / __|
// | |_| | |_| | \__ \
//  \__,_|\__|_|_|___/

const { /* join, relative, resolve, */ extname } = require('path');
// const { stat, readFile } = require('fs');

const _ = require('lodash');

const sass = require('node-sass');
const sassUtils = require('node-sass-utils')(sass);

const merge = Object.assign.bind(Object, Object.create(null));

function replaceExt(filename, extension) {
  return filename.slice(0, 0 - extname(filename).length) + extension;
}

sassUtils.toSass = function (jsValue = {}) {
  if (jsValue && !(typeof jsValue.toSass === 'function')) {
    // Infer Sass value from JS string value.
    if (_.isString(jsValue)) {
      jsValue = sassUtils.infer(jsValue);

      // Check each item in array for inferable values.
    } else if (_.isArray(jsValue)) {
      jsValue = _.map(jsValue, item => sassUtils.toSass(item));

      // Check each value in object for inferable values.
    } else if (_.isObject(jsValue)) {
      jsValue = _.mapValues(jsValue, subval => sassUtils.toSass(subval));
    }
  }
  return sassUtils.castToSass(jsValue);
};

sassUtils.infer = function (jsValue) {
  let result;
  try {
    sass.renderSync({
      data: `$_: ___(${jsValue});`,
      functions: {
        '___($value)': value => {
          // result = sassUtils.castToJs(value);
          result = value;
          // console.log(sassUtils.typeof(value));
          return value;
        }
      }
    });
  } catch (e) {
    return jsValue;
  }
  return result;
};

function cssErr(message, bgcolor) {
  return `
  html { font-size: 1em; position: relative; }
  html:before {
    position: absolute;
    top: 0; left: 0;
    display: block;
    width: 100%;
    padding: 1rem;
    font-family: monospace;
    content: '${message}';
    white-space: pre-wrap;
    background-color: ${bgcolor};
  }`;
}

// const cssEsc = require('cssesc');

// function sassErr(err) {
//   var file = path.relative(process.cwd(), err.file);
//   return cssEsc(`Sass Error: ${err.toString()}\n\n${file}:${err.line}`);
// }

module.exports = {
  replaceExt,
  sassUtils,
  cssErr,
  merge
};