

const fs = require("fs");
const path = require("path");
const { join, relative, resolve, extname } = require("path");
const _ = require("lodash");

const sass = require("node-sass");
const sassUtils = require("node-sass-utils")(sass);
const cssEsc = require("cssesc");
const postcss = require("postcss")([require("autoprefixer")]);



sassUtils.toSass = function(jsValue = {}) {
  if (jsValue && !(typeof jsValue.toSass === "function")) {
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
        "___($value)": value => {
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

module.exports = function (changeTimes) {
  // const ext = ".scss",
  const renderCache = {};
  const renderTimes = {};
  return function(req, res, next) {
    /*
    receive relFile, baseDir, res, next
    parse absFile
    fs.stat absFile ->
      if (err || !stats.isFile()) return next();
      parse outFile
      sass.render({...})
     */
    const filename = join(__dirname, req.url);
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) return next();
      const now = Date.now();
      if (!(filename in renderCache) || renderTimes[filename] < changeTimes[filename]) {
        const relFilename = relative(__dirname, filename);
        const outFilename = relFilename.replace(/\.scss$/, '.css')
        sass.render({
          // file: filename,
          outFile: outFilename,
          data: data.toString(),
          includePaths: ["node_modules", ".", dirname(relFilename)],
          outputStyle: "nested",
          // sourceMap: true,
          sourceMapEmbed: true,
          sourceMapContents: false, //?
          functions: {
            "require($path)": function(path) {
              return sassUtils.toSass(
                require(sassUtils.sassString(path))
              );
            },
            "pow($x, $y)": function(x, y) {
              return new sass.types.Number(
                Math.pow(x.getValue(), y.getValue())
              );
            }
          }
        }, (err, data) => {
          if (err) {
            return renderCache[filename] = cssErr(err.formatted, "yellow");
          }
          // http://api.postcss.org/global.html#processOptions
          postcss.process(data.css, {
              from: relFilename,
              to: outFilename,
              map: data.map
                ? { inline: true, prev: data.map.toString() }
                : false
            })
            .then(data => {
              data.warnings().forEach(warning => console.warn(warning.toString()));
              renderCache[filename] = data.css;
            });
        });
        renderTimes[filename] = now;
      }
      console.log(`.scss file -- changed: ${changeTimes[filename]}; rendered: ${renderTimes[filename]}; served: ${now}`);
      res.setHeader("Content-Type", "text/css");
      res.end(renderCache[filename]);
    });
  };
}
