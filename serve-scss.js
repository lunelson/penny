// ___  ___ ___ ___
// / __|/ __/ __/ __|
// \__ \ (__\__ \__ \
// |___/\___|___/___/

const sass = require('node-sass');
const sassUtils = require('node-sass-utils')(sass);
const postcss = require('postcss')([require('autoprefixer')]);
const cssEsc = require('cssesc');

const fs = require('fs');
const path = require('path');
const { stat } = require('fs');
const { join, relative, resolve, extname, dirname } = require('path');
const _ = require('lodash');

///
/// UTILS
///

sassUtils.toSass = function(jsValue = {}) {
  if (jsValue && !(typeof jsValue.toSass === 'function')) {
    // Infer Sass value from JS string value.
    if (_.isString(jsValue)) {
      jsValue = sassUtils.infer(jsValue);

    // Check each item in array for inferable values.
    } else if (_.isArray(jsValue)) {
      jsValue = _.map(jsValue, item => sassUtils.toSass(item));

    // Check each value in object for inferable values.
    } else if (_.isObject(jsValue)) {
      jsValue = _.mapValues(jsValue, subval =>
        sassUtils.toSass(subval)
      );
    }
  }
  return sassUtils.castToSass(jsValue);
};

sassUtils.infer = function(jsValue) {
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

///
/// RENDER
///

function scssRender(relFile, errorFn, resultFn) {
  const outFile = relFile.replace(/\.scss$/, '.css');
  sass.render(
    {
      file: relFile,
      outFile: outFile,
      // data: data.toString(),
      includePaths: [
        'node_modules',
        '.',
        dirname(relFile)
      ],
      outputStyle: 'nested',
      sourceMap: true,
      // sourceMapEmbed: true,
      // sourceMapContents: false, //?
      functions: {
        'require($path)': function(path) {
          return sassUtils.toSass(
            require(sassUtils.sassString(path))
          );
        },
        'pow($x, $y)': function(x, y) {
          return new sass.types.Number(
            Math.pow(x.getValue(), y.getValue())
          );
        }
      }
    },
    (err, data) => {
      if (err) return errorFn(err);
      // http://api.postcss.org/global.html#processOptions
      postcss.process(data.css, {
        from: relFile,
        to: outFile,
        map: data.map
          ? { inline: true, prev: data.map.toString() }
          : false
      }).then(data => {
        data.warnings().forEach(warning => console.warn(warning.toString()));
        return resultFn(data);
      });
    }
  );
}

///
/// SUBWARE
///

module.exports = function(baseDir, changeTimes) {
  const renderCache = {};
  const renderTimes = {};
  return function(absFile, res, next) {
    stat(absFile, (err, stats) => {
      if (err || !stats.isFile()) return next();
      const ext = extname(absFile);
      const now = Date.now();
      if (
        !(absFile in renderCache) ||
        renderTimes[absFile] < changeTimes[ext]
      ) {
        const relFile = relative(baseDir, absFile);
        scssRender(relFile, (err) => {
          renderCache[absFile] = cssErr( err.formatted, 'yellow');
        }, (data) => {
          renderCache[absFile] = data.css;
        });
        renderTimes[absFile] = now;
      }
      console.log(`${ext} file -- \n changed: ${changeTimes[ext]} \n rendered: ${renderTimes[absFile]} \n served: ${now}`);
      res.setHeader('Content-Type', 'text/css');
      res.end(renderCache[absFile]);
    });
  };
};
