const path = require('path');
const requireResolve = require('resolve'); // for implementing require in put

__dirname; //?
path.resolve('../../node_modules/http2', __dirname); //?
path.resolve(__dirname, '../../node_modules/http2'); //?

// require('../../node_modules/http2'); //?
// require(path.resolve(__dirname, '../../node_modules/http2')); //?
requireResolve.sync('http2', { basedir: __dirname }); //?
