

function srcServer(...srcExts) {
  const renderFns = srcExts.reduce((obj, ext) => {/*...*/})
  return function(reqFile, res, next) {
    return srcExts.find(srcExt => {
      const srcFile = replaceExt(reqFile, srcExt); // 0.
      return stat(srcFile, (err, stats) => { // 1.
        if (err || !stats.isFile()) return false; // 2.
        res.setHeader('Cache-Control', isDev?'no-cache':'public'); // 3a.
        res.setHeader('Content-Type', srcContentTypes[srcExt]); // 3b.
        if (!(srcFile in renderCache) || renderTimes[srcFile] < changeTimes[srcExt]) { // 4.
          renderTimes && (renderTimes[srcFile] = Date.now());
          renderCache[srcFile] = renderFns[srcExt](srcFile);
        }
        renderCache[srcFile].then(data => { // 5.-5c.
          loggerFn.debug(`${relative(srcDir, srcFile)}\nchanged: ${changeTimes[srcExt]} \nrendered: ${renderTimes[srcFile]}\nserved: ${Date.now()}`);
          res.end(data);
        });
        return true;
      });
    }) || next();
  }
}
