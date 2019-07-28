const path = require('path');

const dartSass = require('sass');
const nodeSass = require('node-sass');
const sassUtils = require('node-sass-utils')(nodeSass);
const readData = require('read-data'); // NB: this should be replacee with own read-data
const imageSize = require('image-size');
var findup = require('findup-sync');

/**
 *  ___  __ _ ___ ___
 * / __|/ _` / __/ __|
 * \__ \ (_| \__ \__ \
 * |___/\__,_|___/___/
 *
 * https://sass-lang.com/
 * https://github.com/sass/dart-sass
 * https://github.com/sass/node-sass
 */

module.exports = function(compiler) {
  const {
    srcFile,
    outFile,
    depFiles,
    options: { isDev, srcDir, useDartSass },
  } = compiler;

  function absolve(relPath) {
    return relPath[0] === '/'
      ? path.join(srcDir, relPath)
      : path.resolve(path.dirname(srcFile), relPath);
  }

  const sassEngine = useDartSass ? nodeSass : dartSass;

  const sassOptions = {
    file: srcFile,
    outFile: outFile,
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
    sourceMapRoot: path.relative(outFile, srcDir),
    functions: {
      // PENNY
      // 'require($relFile)'(relFile) {
      //   const absFile = requireResolve.sync(relFile.getValue(), {
      //     basedir: path.dirname(srcFile),
      //   });
      //   delete require.cache[absFile];
      //   depFiles.push(absFile);
      //   return sassUtils.toSass(require(absFile));
      // },
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
      // numeric
      'sign($x)'(x) { return new sassEngine.types.Number(Math.sign(x.getValue())); },
      'trunc($x)'(x) { return new sassEngine.types.Number(Math.trunc(x.getValue())); },
      'pow($x, $y)'(x, y) { return new sassEngine.types.Number(Math.pow(x.getValue(), y.getValue())); },
      'sqrt($x)'(x) { return new sassEngine.types.Number(Math.sqrt(x.getValue())); },
      'cbrt($x)'(x) { return new sassEngine.types.Number(Math.cbrt(x.getValue())); },
      'exp($x)'(x) { return new sassEngine.types.Number(Math.exp(x.getValue())); },
      'expm1($x)'(x) { return new sassEngine.types.Number(Math.expm1(x.getValue())); },
      'log($x)'(x) { return new sassEngine.types.Number(Math.log(x.getValue())); },
      'log1p($x)'(x) { return new sassEngine.types.Number(Math.log1p(x.getValue())); },
      'log10($x)'(x) { return new sassEngine.types.Number(Math.log10(x.getValue())); },
      'log2($x)'(x) { return new sassEngine.types.Number(Math.log2(x.getValue())); },
      'hypot($x, $y)'(x, y) { return new sassEngine.types.Number(Math.hypot(x.getValue(), y.getValue())); },
      // trigonometric -- NB must handle deg conversion
      'deg2rad($deg)'(deg) { return new sassEngine.types.Number(deg.getValue() * Math.PI / 180) },
      'rad2deg($rad)'(rad) { return new sassEngine.types.Number(rad.getValue() * 180 / Math.PI) },
      'sin($rad)'(rad) { return new sassEngine.types.Number(Math.sin(rad.getValue())); },
      'cos($rad)'(rad) { return new sassEngine.types.Number(Math.cos(rad.getValue())); },
      'tan($rad)'(rad) { return new sassEngine.types.Number(Math.tan(rad.getValue())); },
      'acos($x)'(x) { return new sassEngine.types.Number(Math.acos(x.getValue())); },
      'asin($x)'(x) { return new sassEngine.types.Number(Math.asin(x.getValue())); },
      'atan($x)'(x) { return new sassEngine.types.Number(Math.atan(x.getValue())); },
      'atan2($y, $x)'(y, x) { return new sassEngine.types.Number(Math.atan2(y.getValue(), x.getValue())); },
      // 'acosh($x)'(x) { return new sassEngine.types.Number(Math.acosh(x.getValue())); },
      // 'asinh($x)'(x) { return new sassEngine.types.Number(Math.asinh(x.getValue())); },
      // 'atanh($x)'(x) { return new sassEngine.types.Number(Math.atanh(x.getValue())); },
      // 'cosh($x)'(x) { return new sassEngine.types.Number(Math.cosh(x.getValue())); },
      /* eslint-enable prettier/prettier */
    },
  };

  return {
    sassEngine,
    sassOptions,
  };
};
