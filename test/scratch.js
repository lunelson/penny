let isDev = true;

const test = [
  isDev && 'foo',
  'bar',
  isDev && 'baz',
].filter(item => item); //?

process.cwd(); //?

const { resolve, dirname, basename, relative } = require('path');

const testpath = '/user/lu/some/path/to/file.js';
const basedir = '/user/lu/some';

const testdir = dirname(testpath); //?
relative(basedir, testdir); //?
resolve(basedir, '../assets'); //?
