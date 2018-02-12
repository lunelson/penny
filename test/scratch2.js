const resolve = require('resolve');
const path = require('path');

// resolve.sync('node_modules', {basedir: __dirname}); //?
__dirname; //?
path.resolve('node_modules'); //?

const findup = require('findup-sync'); //?
findup('node_modules', { cwd: __dirname }); //?
