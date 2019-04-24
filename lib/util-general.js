const { relative, extname, join, resolve, dirname, basename } = require('path');

const _ = require('lodash');
const debounceTime = 150;

const fileEventNames = ['change', 'add', 'unlink'];

const outExtTypeHeaders = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const mdExts = ['.md', '.mdown', '.markdown'];

// NB order of ext type listing here is also order of priority for serve/compile
const outSrcExts = {
  '.html': ['.html', '.htm', '.pug', '.njk', '.ejs', ...mdExts],
  '.css': ['.css', '.scss', '.sass', '.styl'],
};

const srcOutExts = Object.keys(outSrcExts).reduce((obj, key) => {
  outSrcExts[key].forEach(ext => (obj[ext] = key));
  return obj;
}, {});

const srcExts = Object.keys(srcOutExts);

const htmlSrcExtRE = `(${outSrcExts['.html'].map(ext => ext.slice(1)).join('|')})`;
const cssSrcExtRE = `(${outSrcExts['.css'].map(ext => ext.slice(1)).join('|')})`;
const srcExtRE = `(${Object.keys(srcOutExts)
  .map(ext => ext.slice(1))
  .join('|')})`;

// const htmlSrcGlob = `**/*.(${outSrcExts['.html'].map(ext => ext.slice(1)).join('|')})`;
// const cssSrcGlob = `**/*.(${outSrcExts['.css'].map(ext => ext.slice(1)).join('|')})`;
// const srcGlob = `**/*.(${[]
//   .concat(..._.values(outSrcExts))
//   .map(ext => ext.slice(1))
//   .join('|')})`;

//
// utilities
//

function replaceExt(filepath, ext) {
  return filepath.trim().replace(new RegExp(`${extname(filepath)}$`), ext);
}

function removeExt(str) {
  const extIndex = str.lastIndexOf('.');
  return ~extIndex ? str.slice(0, extIndex) : str;
}

function Deferral(constructor) {
  let res, rej;
  const promise = new Promise((resolve, reject) => {
    if (constructor) constructor(resolve, reject);
    res = resolve;
    rej = reject;
  });
  promise.resolve = a => {
    res(a);
    return promise;
  };
  promise.reject = a => {
    rej(a);
    return promise;
  };
  return promise;
}

module.exports = {
  Deferral,
  removeExt,
  replaceExt,

  outExtTypeHeaders,
  outSrcExts,
  srcOutExts,
  srcExts,
  mdExts,

  srcExtRE,
  cssSrcExtRE,
  htmlSrcExtRE,

  debounceTime,
  fileEventNames,
};