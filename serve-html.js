//  _ __  _   _  __ _
// | '_ \| | | |/ _` |
// | |_) | |_| | (_| |
// | .__/ \__,_|\__, |
// | |           __/ |
// |_|          |___/

const { join, relative, resolve, extname } = require('path');
const { stat } = require('fs');

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
        // process this shit
      }
    });
    console.log(`${ext} file -- \n changed: ${changeTimes[ext]} \n rendered: ${renderTimes[absFile]} \n served: ${now}`);
    res.setHeader('Content-Type', 'text/html');
    res.end(renderCache[absFile]);
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
    cache = {}, locals = {};
  let renderTime = 0, timeStats = '';
  return function (req, res, next) {
    const filename = join(__dirname, req.url);
    fs.readFile(filename, 'utf8', (err, data) => {
      if (!data) return next();
      const now = Date.now();
      if (renderTime < changeTimes[ext]) {
        cache[req.url] = Pug.render(data.toString(), Object.assign({}, locals, {
          cache: false,
          pretty: true,
          basedir: __dirname,
          filename,
        }));
        timeStats = `${ext} file -- changed: ${changeTimes[ext]}; rendered: ${now};`;
        renderTime = now;
      }
      console.log(`${timeStats} served: ${now}`);
      res.end(cache[req.url]);
    });
  };
}
