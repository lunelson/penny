// node
const { relative, dirname, join } = require('path');

// npm
const _ = require('lodash');
const sass = require('node-sass');
const sassUtils = require('node-sass-utils')(sass);
const imageSize = require('image-size');
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
        _.map(jsValue, val => sassUtils.toSass(val)) :
        _.isObject(jsValue) ?
          _.mapValues(jsValue, val => sassUtils.toSass(val)) :
          jsValue ;

    // // Infer Sass value from JS string value.
    // if (_.isString(jsValue)) {
    //   jsValue = sassUtils.infer(jsValue);

    //   // Check each item in array for inferable values.
    // } else if (_.isArray(jsValue)) {
    //   jsValue = _.map(jsValue, item => sassUtils.toSass(item));

    //   // Check each value in object for inferable values.
    // } else if (_.isObject(jsValue)) {
    //   jsValue = _.mapValues(jsValue, subval => sassUtils.toSass(subval));
    // }
  }
  return sassUtils.castToSass(jsValue);
};

sassUtils.infer = function (jsValue) {
  let result;
  try {
    sass.renderSync({
      data: `$_: infer(${jsValue});`,
      functions: { 'infer($value)': value => { result = value; return value; } }
    });
  } catch (e) { return jsValue; }
  return result;
};

//                    ______
//                    |  ___|
//  ___  __ _ ___ ___ | |_ _ __  ___
// / __|/ _` / __/ __||  _| '_ \/ __|
// \__ \ (_| \__ \__ \| | | | | \__ \
// |___/\__,_|___/___/\_| |_| |_|___/

module.exports = function sassFns(filename){
  return {
    'require($path)': function(path) {
      const modulePath = resolve.sync(path.getValue(), { basedir: dirname(filename) });
      delete require.cache[modulePath];
      return sassUtils.toSass(require(modulePath));
    },
    'image-size($relImg)': function(relImg) {
      const absImg = join(dirname(filename), relImg.getValue());
      return sassUtils.toSass(imageSize(absImg));
    },
    'pow($x, $y)': function(x, y) {
      return new sass.types.Number(Math.pow(x.getValue(), y.getValue()));
    },
    'sqrt($x)': function(x) {
      return new sass.types.Number(Math.sqrt(x.getValue()));
    },
    'sign($x)': function(x) {
      return new sass.types.Number(Math.sign(x.getValue()));
    },
    'trunc($x)': function(x) {
      return new sass.types.Number(Math.trunc(x.getValue()));
    }
  };
};

// SASS DATA???
// data: `$E: ${Math.E}; $LN2: ${Math.LN2}; $LN10: ${Math.LN10}; $LOG2E: ${Math.LOG2E}; $LOG10E: ${Math.LOG10E}; $PI: ${Math.PI}; $SQRT1_2: ${Math.SQRT1_2}; $SQRT2: ${Math.SQRT2};`,
