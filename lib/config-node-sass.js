// node
const {
  resolve,
  dirname,
  join
} = require('path');

// npm
const _ = require('lodash');
const readData = require('read-data');
const imageSize = require('image-size');
const requireResolve = require('resolve');

const nodeSass = require('node-sass');
const sassUtils = require('node-sass-utils')(nodeSass);
var findup = require('findup-sync');

const {
  sassLogger
} = require('./loggers.js');

module.exports = function (srcDir, options) {

  const {
    isDev,
  } = options;

  return function (srcFile, depFiles) {

    function absolve(relPath) {
      return relPath[0] === '/' ?
        join(srcDir, relPath) :
        resolve(dirname(srcFile), relPath);
    }

    return {

      // OPTIONS
      includePaths: [findup('node_modules', {
        cwd: srcDir
      }), srcDir],
      indentedSyntax: false,
      outputStyle: isDev ? 'expanded' : 'compressed',
      sourceMap: isDev,
      sourceMapContents: true,
      sourceMapEmbed: true,
      sourceMapRoot: srcDir,

      // FUNCTIONS
      functions: {
        'require($relFile)'(relFile) {
          const absFile = requireResolve.sync(relFile.getValue(), {
            basedir: dirname(srcFile)
          });
          sassLogger.trace(`requiring: ${absFile}`);
          delete require.cache[absFile];
          depFiles.push(absFile);
          return sassUtils.toSass(require(absFile));
        },
        'read-data($relFile)'(relFile) {
          const absFile = absolve(relFile.getValue());
          sassLogger.trace(`reading data: ${absFile}`);
          depFiles.push(absFile);
          return sassUtils.toSass(readData.sync(absFile));
        },
        'image-size($relFile)'(relFile) {
          const absFile = absolve(relFile.getValue());
          sassLogger.trace(`parsing image: ${absFile}`);
          depFiles.push(absFile);
          return sassUtils.toSass(imageSize(absFile));
        },

        // POWERS

        'pow($x, $y)'(x, y) {
          return new nodeSass.types.Number(Math.pow(x.getValue(), y.getValue()));
        },
        'sqrt($x)'(x) {
          return new nodeSass.types.Number(Math.sqrt(x.getValue()));
        },

        // TRIGONOMETRY

        'sin($deg)'(deg) {
          return new nodeSass.types.Number(Math.sin(deg.getValue()*Math.PI/180));
        },
        'cos($deg)'(deg) {
          return new nodeSass.types.Number(Math.cos(deg.getValue()*Math.PI/180));
        },
        'tan($deg)'(deg) {
          return new nodeSass.types.Number(Math.tan(deg.getValue()*Math.PI/180));
        },

        // INVERSE TRIGONOMETRY
        'sign($x)'(x) {
          return new nodeSass.types.Number(Math.sign(x.getValue()));
        },
        'trunc($x)'(x) {
          return new nodeSass.types.Number(Math.trunc(x.getValue()));
        },
        // Returns the arccosine of a number.
        'acos($x)'(x) {
          return new nodeSass.types.Number(Math.acos(x.getValue()));
        },
        // Returns the hyperbolic arccosine of a number.
        'acosh($x)'(x) {
          return new nodeSass.types.Number(Math.acosh(x.getValue()));
        },
        // Returns the arcsine of a number.
        'asin($x)'(x) {
          return new nodeSass.types.Number(Math.asin(x.getValue()));
        },
        // Returns the hyperbolic arcsine of a number.
        'asinh($x)'(x) {
          return new nodeSass.types.Number(Math.asinh(x.getValue()));
        },
        // Returns the arctangent of a number.
        'atan($x)'(x) {
          return new nodeSass.types.Number(Math.atan(x.getValue()));
        },
        // Returns the hyperbolic arctangent of a number.
        'atanh($x)'(x) {
          return new nodeSass.types.Number(Math.atanh(x.getValue()));
        },
        // Returns the arctangent of the quotient of its arguments.
        'atan2($y, $x)'(y, x) {
          return new nodeSass.types.Number(Math.atan2(y.getValue(), x.getValue()));
        },
        // Returns the cube root of a number.
        'cbrt($x)'(x) {
          return new nodeSass.types.Number(Math.cbrt(x.getValue()));
        },
        // Returns the smallest integer greater than or equal to a number.
        'ceil($x)'(x) {
          return new nodeSass.types.Number(Math.ceil(x.getValue()));
        },
        // Returns the hyperbolic cosine of a number.
        'cosh($x)'(x) {
          return new nodeSass.types.Number(Math.cosh(x.getValue()));
        },
        // Returns Ex, where x is the argument, and E is Euler's constant (2.718…), the base of the natural logarithm.
        'exp($x)'(x) {
          return new nodeSass.types.Number(Math.exp(x.getValue()));
        },
        // Returns subtracting 1 from exp(x).
        'expm1($x)'(x) {
          return new nodeSass.types.Number(Math.expm1(x.getValue()));
        },
        // Returns the square root of the sum of squares of its arguments.
        'hypot($x, $args...)'(x, ...args) {
          return new nodeSass.types.Number(Math.hypot(x.getValue(), ...args.getValue()));
        },
        // Returns the natural logarithm (loge, also ln) of a number.
        'log($x)'(x) {
          return new nodeSass.types.Number(Math.log(x.getValue()));
        },
        // Returns the natural logarithm (loge, also ln) of 1 + x for a number x.
        'log1p($x)'(x) {
          return new nodeSass.types.Number(Math.log1p(x.getValue()));
        },
        // Returns the base 10 logarithm of a number.
        'log10($x)'(x) {
          return new nodeSass.types.Number(Math.log10(x.getValue()));
        },
        // Returns the base 2 logarithm of a number.
        'log2($x)'(x) {
          return new nodeSass.types.Number(Math.log2(x.getValue()));
        },
      }
    };
  };
};
