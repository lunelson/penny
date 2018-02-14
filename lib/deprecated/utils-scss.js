// node
const { relative } = require('path');

// npm
const _ = require('lodash');
const Sass = require('node-sass');
const sassUtils = require('node-sass-utils')(Sass);
const resolve = require('resolve');

//                    _   _ _   _ _
//                   | | | | | (_) |
//  ___  __ _ ___ ___| | | | |_ _| |___
// / __|/ _` / __/ __| | | | __| | / __|
// \__ \ (_| \__ \__ \ |_| | |_| | \__ \
// |___/\__,_|___/___/\___/ \__|_|_|___/


sassUtils.toSass = function (jsValue = {}) {
  if (jsValue && !(typeof jsValue.toSass === 'function')) {

    jsValue = _.isString(jsValue) ?
      sassUtils.infer(jsValue) :
      _.isArray(jsValue) ?
        _.map() :
        _.isObject(jsValue) ?
          _.mapValues() :
          jsValue ;

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
    Sass.renderSync({
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


//                    ______
//                    |  ___|
//  ___  __ _ ___ ___ | |_ _ __  ___
// / __|/ _` / __/ __||  _| '_ \/ __|
// \__ \ (_| \__ \__ \| | | | | \__ \
// |___/\__,_|___/___/\_| |_| |_|___/


const sassFns = {
  'require($path)': function(path) {
    return sassUtils.toSass(require(sassUtils.sassString(path)));
  },
  'pow($x, $y)': function(x, y) {
    return new Sass.types.Number(Math.pow(x.getValue(), y.getValue()));
  },
  'sqrt($x)': function(x) {
    return new Sass.types.Number(Math.sqrt(x.getValue()));
  },
  'sign($x)': function(x) {
    return new Sass.types.Number(Math.sign(x.getValue()));
  },
  'trunc($x)': function(x) {
    return new Sass.types.Number(Math.trunc(x.getValue()));
  }
};

// SASS DATA???
// data: `$E: ${Math.E}; $LN2: ${Math.LN2}; $LN10: ${Math.LN10}; $LOG2E: ${Math.LOG2E}; $LOG10E: ${Math.LOG10E}; $PI: ${Math.PI}; $SQRT1_2: ${Math.SQRT1_2}; $SQRT2: ${Math.SQRT2};`,

module.exports = {

  sassUtils,

};
