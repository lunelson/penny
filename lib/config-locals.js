const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const _dayjs = require('dayjs');
const _moment = require('moment');
const _dateFns = require('date-fns');
const _faker = require('faker');
const _chance = new (require('chance'))();
const _casual = require('casual');
const _case = require('change-case');

module.exports = function(compiler) {
  const {
    options: { isDev, $data, $routes },
  } = compiler;

  return {
    // introspection
    $compiler: compiler,
    $env: isDev ? 'development' : 'production',
    $data,
    $routes,

    // fakery
    _faker,
    _chance,
    _casual,

    // dates
    _dayjs,
    _moment,
    _dateFns,

    // utils
    _,
    _case,

    // node
    __fs: fs,
    __path: path,

    // utilities
    dump(value) {
      return JSON.stringify(value, null, 2);
    },
  };
};
