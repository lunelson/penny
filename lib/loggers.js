const eazyLevels = [ 'trace', 'debug', 'warn', 'info', 'error' ];
const eazyLogger = require('eazy-logger').Logger({useLevelPrefixes: false, prefix: false});

const pennyLogger = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](`[{green:penny}] ${str}`);}; return obj; }, {});
const webpackLogger = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](`[{cyan:webpack}] ${str}`);}; return obj; }, {});
const sassLogger = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](`[{magenta:sass}] ${str}`);}; return obj; }, {});
const pugLogger = eazyLevels.reduce((obj, level) => { obj[level] = function(str){eazyLogger[level](`[{yellow:pug}] ${str}`);}; return obj; }, {});

module.exports = { eazyLogger, pennyLogger, webpackLogger, sassLogger, pugLogger };
