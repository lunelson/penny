const path = require('path');

// NB: this should be replace with own read-data
const readData = require('read-data');
const imageSize = require('image-size');
const requireResolve = require('resolve');
const nodeSass = require('node-sass');
const sassUtils = require('node-sass-utils')(nodeSass);
var findup = require('findup-sync');

module.exports = function(compiler) {
  const {
    srcFile,
    depFiles,
    options,
    options: { isDev, srcDir },
  } = compiler;

  function absolve(publicPath) {
    return publicPath[0] === '/'
      ? path.join(srcDir, publicPath)
      : path.resolve(path.dirname(srcFile), publicPath);
  }

  return {
    includePaths: [
      findup('node_modules', {
        cwd: srcDir,
      }),
      srcDir,
    ],

    outputStyle: isDev ? 'expanded' : 'compressed',
    sourceMap: isDev,
    sourceMapContents: true,
    sourceMapEmbed: true,
    sourceMapRoot: srcDir,
    functions: {
      // PENNY
      'require($relFile)'(relFile) {
        const absFile = requireResolve.sync(relFile.getValue(), {
          basedir: path.dirname(srcFile),
        });
        delete require.cache[absFile];
        depFiles.push(absFile);
        return sassUtils.toSass(require(absFile));
      },
      'read-data($relFile)'(relFile) {
        const absFile = absolve(relFile.getValue());
        depFiles.push(absFile);
        return sassUtils.toSass(readData.sync(absFile));
      },
      'image-size($relFile)'(relFile) {
        const absFile = absolve(relFile.getValue());
        depFiles.push(absFile);
        return sassUtils.toSass(imageSize(absFile));
      },
      // MATH
      /* eslint-disable prettier/prettier */
      'pow($x, $y)'(x, y) { return new nodeSass.types.Number(Math.pow(x.getValue(), y.getValue())); },
      'sqrt($x)'(x) { return new nodeSass.types.Number(Math.sqrt(x.getValue())); },
      'sin($deg)'(deg) { return new nodeSass.types.Number(Math.sin((deg.getValue() * Math.PI) / 180)); },
      'cos($deg)'(deg) { return new nodeSass.types.Number(Math.cos((deg.getValue() * Math.PI) / 180)); },
      'tan($deg)'(deg) { return new nodeSass.types.Number(Math.tan((deg.getValue() * Math.PI) / 180)); },
      'sign($x)'(x) { return new nodeSass.types.Number(Math.sign(x.getValue())); },
      'trunc($x)'(x) { return new nodeSass.types.Number(Math.trunc(x.getValue())); },
      'acos($x)'(x) { return new nodeSass.types.Number(Math.acos(x.getValue())); },
      'acosh($x)'(x) { return new nodeSass.types.Number(Math.acosh(x.getValue())); },
      'asin($x)'(x) { return new nodeSass.types.Number(Math.asin(x.getValue())); },
      'asinh($x)'(x) { return new nodeSass.types.Number(Math.asinh(x.getValue())); },
      'atan($x)'(x) { return new nodeSass.types.Number(Math.atan(x.getValue())); },
      'atanh($x)'(x) { return new nodeSass.types.Number(Math.atanh(x.getValue())); },
      'atan2($y, $x)'(y, x) { return new nodeSass.types.Number(Math.atan2(y.getValue(), x.getValue())); },
      'cbrt($x)'(x) { return new nodeSass.types.Number(Math.cbrt(x.getValue())); },
      'ceil($x)'(x) { return new nodeSass.types.Number(Math.ceil(x.getValue())); },
      'cosh($x)'(x) { return new nodeSass.types.Number(Math.cosh(x.getValue())); },
      'exp($x)'(x) { return new nodeSass.types.Number(Math.exp(x.getValue())); },
      'expm1($x)'(x) { return new nodeSass.types.Number(Math.expm1(x.getValue())); },
      'hypot($x, $args...)'(x, ...args) { return new nodeSass.types.Number(Math.hypot(x.getValue(), ...args.getValue())); },
      'log($x)'(x) { return new nodeSass.types.Number(Math.log(x.getValue())); },
      'log1p($x)'(x) { return new nodeSass.types.Number(Math.log1p(x.getValue())); },
      'log10($x)'(x) { return new nodeSass.types.Number(Math.log10(x.getValue())); },
      'log2($x)'(x) { return new nodeSass.types.Number(Math.log2(x.getValue())); },
      /* eslint-enable prettier/prettier */
    },
  };
};
