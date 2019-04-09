// const eazyLevels = [ 'trace', 'debug', 'warn', 'info', 'error' ];
const ez = require('eazy-logger');
const ls = require('log-symbols');

const config = {
  useLevelPrefixes: true,
  // prefixes: {
  //   'trace': '[trace] ',
  //   'debug': `{yellow:[debug] ${ls.info}} `,
  //   'info':  `{cyan:[info] ${ls.success}} `,
  //   'warn':  `{magenta:[warn] ${ls.warning}} `,
  //   'error': `{red:[error] ${ls.error}} `
  // }
};

module.exports = {
  pennyLogger: ez.Logger({ ...config, prefix: '\n[{blue:penny}]' }),
  dataLogger: ez.Logger({ ...config, prefix: '\n[{blue:penny}/{green:data}]' }),
  htmlLogger: ez.Logger({ ...config, prefix: '\n[{blue:penny}/{red:html}]' }),
  cssLogger: ez.Logger({ ...config, prefix: '\n[{blue:penny}/{magenta:css}]' }),
  jsLogger: ez.Logger({ ...config, prefix: '\n[{blue:penny}/{cyan:webpack}]' }),
  logger: ez.Logger({ useLevelPrefixes: false, prefix: false }),
};

/*
  logger.js.info(')
  logger.penny.debug()
  log('penny').debug('')
*/
