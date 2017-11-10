//  _ __  _   _  __ _
// | '_ \| | | |/ _` |
// | |_) | |_| | (_| |
// | .__/ \__,_|\__, |
// | |           __/ |
// |_|          |___/

const { join, relative, resolve, extname } = require('path');
const { stat, readFile } = require('fs');

function replaceExt(filename, extension) {
  return filename.slice(0, 0 - extname(filename).length) + extension;
}

///
/// SUBWARE
///

module.exports = function(baseDir, changeTimes) {
  const renderCache = {};
  const renderTimes = {};
  const srcExt = '.pug';
  return function(reqFile, res, next) {
    stat(reqFile, (err, stats) => {
      if (!err && stats.isFile()) return next();
      // const srcFile = reqFile.replace(new RegExp(`${extname(reqFile)}$`), srcExt);
      const srcFile = replaceExt(reqFile, srcExt);
      stat(srcFile, (err, stats) => {
        if (err || !stats.isFile()) return next();
        const now = Date.now();
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) {
          // process this shit
        }
        console.log(
          `${srcExt} file -- \n changed: ${changeTimes['.pug']} \n rendered: ${
            renderTimes[srcFile]
          } \n served: ${now}`
        );
        res.setHeader('Content-Type', 'text/html');
        res.end(renderCache[srcFile]);
      });
    });
  };
};

// _ __  _   _  __ _
// | '_ \| | | |/ _` |
// | |_) | |_| | (_| |
// | .__/ \__,_|\__, |
// | |           __/ |
// |_|          |___/

const Pug = require('pug');
/*
  TODO
  - add utilities to pug locals
  - add pug-error rendering to HTML
*/
function pugWare(changeTimes) {
  const ext = '.pug',
    cache = {},
    locals = {};
  let renderTime = 0,
    timeStats = '';
  return function(req, res, next) {
    const filename = join(__dirname, req.url);
    readFile(filename, 'utf8', (err, data) => {
      if (!data) return next();
      const now = Date.now();
      if (renderTime < changeTimes[ext]) {
        cache[req.url] = Pug.render(
          data.toString(),
          Object.assign({}, locals, {
            cache: false,
            pretty: true,
            basedir: __dirname,
            filename
          })
        );
        timeStats = `${ext} file -- changed: ${changeTimes[ext]}; rendered: ${now};`;
        renderTime = now;
      }
      console.log(`${timeStats} served: ${now}`);
      res.end(cache[req.url]);
    });
  };
}
