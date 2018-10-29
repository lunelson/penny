const url = require('url');
const path = require('path');
const resolve = require('resolve');

const basedir = '/Users/lunelson/Git/packages/penny/test';
const filename = '/Users/lunelson/Git/packages/penny/test/util/pug/props/index.pug';

// COMPUTED locals
const dirname = path.dirname(filename);
const srcPath = path.relative(basedir, filename); //?
const reqPath = '/'+srcPath.replace(/\.pug$/, '.html'); //?
// const absPath = path.join(basedir, '/'+srcPath); //?

__filename; //?
__dirname; //?

/* ======== */
filename; //?
path.dirname(filename); //?
path.basename(filename); //?
url.parse(path.relative(basedir, filename)).pathname; //?

const pug = require('pug');
const _ = require('lodash');

function getFilename() { return this.filename; };
var locals = {};
locals.getFilename = getFilename.bind(locals);
const fileA = `
pre!= getFilename()
`;
const fileB = `
- foobar = 'fuck this'
- locals.shit = 'crap'
pre!= foobar
pre!= getFilename()
`;
var html = pug.render(fileA, Object.assign(_.clone(locals), {filename: 'hello world'})); //?
// var html = pug.render(fileB, Object.assign(locals, {filename: 'hello world'})); //?
var html = pug.render(fileB, Object.assign(_.clone(locals), {filename: 'hello world'})); //?
locals; //?

// require.resolve('./index-api.js', { paths: __filename});
const testPath = path.join(__dirname, './index-api.js'); //?
// require.resolve('./index-api.js', { paths: [__dirname] }); //?
resolve.sync('./index-api', { basedir: __dirname }); //?
