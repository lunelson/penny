const esc = require('js-string-escape');
const path = require('path');

var banner = `
       XXXX    XXXX
       XXXX    XXXX
   XXXXXXXXXXXXXXXXXXXX     _ __   ___ _ __  _ __  _   _
 XXXXXXXXXXXXXXXXXXXXXX    | '_ \\ / _ \\ '_ \\| '_ \\| | | |
XXXX                       | |_) |  __/ | | | | | | |_| |
XXXX                       | .__/ \\___|_| |_|_| |_|\\__, |
 XXXXXXXXXXXXXXXXXXXXXX    | |                      __/ |
   XXXXXXXXXXXXXXXXXXXX    |_|                     |___/
       XXXX    XXXX
       XXXX    XXXX
`;

const eazyLevels = [ 'trace', 'debug', 'warn', 'info', 'error' ];
const eazyLogger = require("eazy-logger").Logger({useLevelPrefixes: false, prefix: false});

const logger = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](str)}; return obj; }, {});
logger.webpack = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](`{blue:[penny]} {cyan:[webpack]} ${str}`)}; return obj; }, {});
logger.sass = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](`{blue:[penny]} {magenta:[sass]} ${str}`)}; return obj; }, {});
logger.pug = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](`{blue:[penny]} {yellow:[pug]} ${str}`)}; return obj; }, {});

logger.info(`{red: ${banner}}`);
logger.webpack.info('hello world');
logger.webpack.error('hello world');
// logger.test.info('hello world');

logger.info(path.extname('/foo/bar.pug'))
