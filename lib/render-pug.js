//                     _
//                    | |
//  _ __ ___ _ __   __| | ___ _ __ ______ _ __  _   _  __ _
// | '__/ _ \ '_ \ / _` |/ _ \ '__|______| '_ \| | | |/ _` |
// | | |  __/ | | | (_| |  __/ |         | |_) | |_| | (_| |
// |_|  \___|_| |_|\__,_|\___|_|         | .__/ \__,_|\__, |
//                                       | |           __/ |
//                                       |_|          |___/

// node
const { relative, dirname } = require('path');

// npm
const Pug = require('pug');

// local
const { pugLogger } = require('./loggers');
const { htmlCssErr } = require('./errors');
const { replaceExt } = require('./utils');
const pugLocals = require('./util/pug-locals');

// export
module.exports = function({srcDir, loggerFn, options}) {

  const { isDev, isBuild } = options;

  return function(srcFile) {

    return new Promise((resolve, reject) => {
      Pug.renderFile(
        srcFile,
        Object.assign(pugLocals(), {
          pretty: isDev,
          basedir: srcDir
        }),
        (err, data) => {
          if (err) reject(err);
          resolve(data);
        }
      );
    })


      .then(data => data)
      .catch(err => {
        if (isBuild) throw Error(err);
        // TODO: better extraction of this error
        // see this for reference on pug Errors https://github.com/pugjs/pug/tree/master/packages/pug-error
        loggerFn.error(err);
        return htmlCssErr(err, '#F2EEE6', 'pug');
      });
  };
};
