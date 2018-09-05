const resolve = require('resolve');
const path = require('path');
const _ = require('lodash');

const pugLocals = require('../lib/util/pug-locals')({ filename: __filename, basedir: path.resolve(__dirname, '../') });

pugLocals.dirList('/src'); //?
pugLocals.dirList('.'); //?

path.resolve(pugLocals.basedir, '../foo'); //?
path.join(pugLocals.basedir, '/foo'); //?
