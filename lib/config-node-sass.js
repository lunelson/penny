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
        // 'consts()'() {
        //   return sassConsts;
        // }
      }
    };
  };
};
