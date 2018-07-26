// node
const { resolve, dirname, join } = require('path');

// npm
const _ = require('lodash');
const readData = require('read-data');
const imageSize = require('image-size');
const requireResolve = require('resolve');

const nodeSass = require('node-sass');
const sassUtils = require('node-sass-utils')(nodeSass);

const { sassLogger } = require('./loggers.js');

sassUtils.toSass = function (jsValue = {}) {
  if (jsValue && !(typeof jsValue.toSass === 'function')) {

    jsValue = _.isString(jsValue) ?
      sassUtils.infer(jsValue) :
      _.isArray(jsValue) ?
        _.map(jsValue, val => sassUtils.toSass(val)) :
        _.isObject(jsValue) ?
          _.mapValues(jsValue, val => sassUtils.toSass(val)) :
          jsValue ;
  }
  return sassUtils.castToSass(jsValue);
};

sassUtils.infer = function (jsValue) {
  let result;
  try {
    nodeSass.renderSync({
      data: `$_: infer(${jsValue});`,
      functions: { 'infer($value)': value => { result = value; return value; } }
    });
  } catch (e) { return jsValue; }
  return result;
};

const mathConsts = _.pick(Math, [ 'E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2', 'SQRT2']);
const sassConsts = sassUtils.castToSass(mathConsts);

module.exports = function(srcDir, srcFile) {
  function absolve(relPath) {
    return relPath[0] === '/' ?
      join(srcDir, relPath) :
      resolve(dirname(srcFile), relPath);
  }
  const includedFiles = [];
  return {
    includedFiles,
    get instance() {
      includedFiles.length = 0;
      return {
        'require($relFile)'(relFile) {
          const absFile = requireResolve.sync(relFile.getValue(), { basedir: dirname(srcFile) });
          sassLogger.trace(`requiring: ${absFile}`);
          delete require.cache[absFile];
          includedFiles.push(absFile);
          return sassUtils.toSass(require(absFile));
        },
        'read-data($relFile)'(relFile) {
          const absFile = absolve(relFile.getValue());
          sassLogger.trace(`reading data: ${absFile}`);
          includedFiles.push(absFile);
          return sassUtils.toSass(readData.sync(absFile));
        },
        'image-size($relFile)'(relFile) {
          const absFile = absolve(relFile.getValue());
          sassLogger.trace(`parsing image: ${absFile}`);
          includedFiles.push(absFile);
          return sassUtils.toSass(imageSize(absFile));
        },
        'pow($x, $y)'(x, y) {
          return new nodeSass.types.Number(Math.pow(x.getValue(), y.getValue()));
        },
        'sqrt($x)'(x) {
          return new nodeSass.types.Number(Math.sqrt(x.getValue()));
        },
        'sign($x)'(x) {
          return new nodeSass.types.Number(Math.sign(x.getValue()));
        },
        'trunc($x)'(x) {
          return new nodeSass.types.Number(Math.trunc(x.getValue()));
        },
        'consts()'() {
          return sassConsts;
        }
      };
    }
  };
};
