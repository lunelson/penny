const sass = require('node-sass');
const { relative } = require('path');
const _ = require('lodash');
//                    _   _ _   _ _
//                   | | | | | (_) |
//  ___  __ _ ___ ___| | | | |_ _| |___
// / __|/ _` / __/ __| | | | __| | / __|
// \__ \ (_| \__ \__ \ |_| | |_| | \__ \
// |___/\__,_|___/___/\___/ \__|_|_|___/

const sassUtils = require('node-sass-utils')(sass);

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

module.exports = {

  sassUtils,

};
