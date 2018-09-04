const { relative, extname, join, resolve, dirname, basename } = require('path');
const _ = require('lodash');

// bsync and connect stuff
const bsync = require('browser-sync').create();
const inject = require('bs-html-injector');
const serveFavicon = require('serve-favicon')(resolve(__dirname, './favicon.ico'));
const serveStaticOptions = { extensions: ['html'] };

const fileEventNames = ['change', 'add', 'unlink'];

const outExtContentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const dataExts = [ '.js', '.json', '.yml', '.yaml', '.csv' ];

const outSrcExts = {
  '.html': ['.pug', '.md', '.mdown', '.markdown'],
  '.css': ['.scss'],
};

const srcOutExts = Object.keys(outSrcExts).reduce((obj, key) => {
  outSrcExts[key].forEach(ext => obj[ext] = key);
  return obj;
}, {});

const dataGlob = `_data/**/*.(${dataExts.map(ext => ext.slice(1)).join('|')})`;
const cssSrcGlob = `**/*.(${outSrcExts['.css'].map(ext => ext.slice(1)).join('|')})`;
const htmlSrcGlob = `**/*.(${outSrcExts['.html'].map(ext => ext.slice(1)).join('|')})`;
const allSrcGlob = `**/*.(${[].concat(..._.values(outSrcExts)).map(ext => ext.slice(1)).join('|')})`;

function replaceExt(filepath, ext) { return filepath.trim().replace(new RegExp(`${extname(filepath)}$`), ext); }

function removeExt(str) { const extIndex = str.lastIndexOf('.'); return ~extIndex ? str.slice(0, extIndex) : str; }

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
  // utils
  Deferral,
  removeExt,
  replaceExt,
  // file extname stuff
  outExtContentTypes,
  outSrcExts,
  srcOutExts,
  dataExts,
  // file globs
  dataGlob,
  allSrcGlob,
  cssSrcGlob,
  htmlSrcGlob,
  // bsync/connect stuff
  fileEventNames,
  bsync,
  inject,
  serveFavicon,
  serveStaticOptions,
};
