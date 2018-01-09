//                     _
//                    | |
//  _ __ ___ _ __   __| | ___ _ __ ______ _ __  _   _  __ _
// | '__/ _ \ '_ \ / _` |/ _ \ '__|______| '_ \| | | |/ _` |
// | | |  __/ | | | (_| |  __/ |         | |_) | |_| | (_| |
// |_|  \___|_| |_|\__,_|\___|_|         | .__/ \__,_|\__, |
//                                       | |           __/ |
//                                       |_|          |___/

module.exports = function(baseDir, isDev, options) {

  return function(srcFile, renderTimes) {

    return new Promise((resolve, reject) => {
      Pug.renderFile(
        srcFile,
        Object.assign({}, pugLocals, {
          pretty: isDev,
          basedir: baseDir,
          pathname: relative(baseDir, srcFile)
        }),
        function(err, data) {
          renderTimes[srcFile] = now;
          if (err != null) return reject(err);
          return resolve(data);
        }
      );
    }).catch(err => {
      // see this for reference on pug Errors https://github.com/pugjs/pug/tree/master/packages/pug-error
      return htmlCssErr(err.toString(), '#F2EEE6', 'pug');
    });
  };
};
