const debug = require('debug');

const mainLogger = debug('penny:main');
const scssLogger = debug('penny:scss');
const cssLogger = debug('penny:css');
const pugLogger = debug('penny:pug');
const jsLogger = debug('penny:js');

module.exports = { mainLogger, scssLogger, cssLogger, pugLogger, jsLogger };

