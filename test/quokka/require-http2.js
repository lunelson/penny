const path = require('path');

__dirname; //?
require('../../node_modules/http2'); //?
path.resolve('../../node_modules/http2', __dirname); //?
path.resolve(__dirname, '../../node_modules/http2'); //?
require(path.resolve(__dirname, '../../node_modules/http2')); //?
