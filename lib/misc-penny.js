const _ = require('lodash');
const { relative, extname, join, resolve, dirname, basename } = require('path');

const extContentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.scss': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.pug': 'text/html; charset=utf-8',
  '.md': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function replaceExt(filepath, ext) { return filepath.trim().replace(new RegExp(`${extname(filepath)}$`), ext); }
function sliceExt(str) { const extIndex = str.lastIndexOf('.'); return ~extIndex ? str.slice(0, extIndex) : str; }

function syncFileDict(obj, event, file, cb) {
  const dataPath = sliceExt(file).split('/');
  dataPath[0] == '_data' && dataPath.shift();
  if (event == 'unlink') {
    _.unset(obj, dataPath);
    while (--dataPath.length && _.isEmpty(_.get(obj, dataPath))) {
      _.unset(obj, dataPath);
    }
  } else _.set(obj, dataPath, cb(file));
}

function Deferral(constructor) {
  let res, rej;
  const promise = new Promise((resolve, reject) => {
    if (constructor) constructor(resolve, reject);
    res = resolve;
    rej = reject;
  });
  promise.resolve = a => { res(a); return promise; };
  promise.reject = a => { rej(a); return promise; };
  return promise;
}

module.exports = { Deferral, extContentTypes, sliceExt, replaceExt, syncFileDict };
