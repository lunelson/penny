const { relative, extname, join, resolve, dirname, basename } = require('path');
const _ = require('lodash');
const UrlPattern = require('url-pattern');
const { stat, readFileSync } = require('fs');
const grayMatter = require('gray-matter');


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

function syncFileTree(obj, event, file, cb) {
  const dataPath = sliceExt(file).split('/');
  dataPath[0] == '_data' && dataPath.shift();
  if (event == 'unlink') {
    _.unset(obj, dataPath);
    while (--dataPath.length && _.isEmpty(_.get(obj, dataPath))) {
      _.unset(obj, dataPath);
    }
  } else _.set(obj, dataPath, cb(file));
}

const $data = Object.create(null);

//
// $pages, $pagesSyncer
//

const $pages = new Map();

$pages.match = function(pattern){
  return Array.from(this.entries()).map(entry => {
    const match = new UrlPattern(`${pattern}(.html)`).match(entry[0]);
    return match ? Object.assign(entry[1], match) : null;
  }).filter(entry => entry);
};

function $pagesSyncer(srcDir) {
  return function(event, relFile) {
    const pathname = '/'+relFile.replace(/\.pug$/, '.html');
    if (event == 'unlink') return $pages.delete(pathname);
    const filename = join(srcDir, relFile);
    const { data } = grayMatter(readFileSync(filename, 'utf8'));
    const $page = Object.assign({ filename, pathname }, data);
    return $pages.set(pathname, $page);
  };
}

//
// Deferral
//

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

module.exports = {
  $data,
  $pages,
  $pagesSyncer,
  Deferral,
  extContentTypes,
  sliceExt,
  replaceExt,
  syncFileTree
};
