const path = require('path');

// https://github.com/lukeed/regexparam
const regexparam = require('regexparam');

const _ = require('lodash');

const mdExts = ['.md', '.mdown', '.markdown'];

const outSrcExts = {
  '.html': ['.pug', '.njk', '.ejs', ...mdExts],
  '.css': ['.scss', '.sass', '.styl'],
  '.js': [], // eventualy .ts, .es ?
};

const srcOutExts = Object.keys(outSrcExts).reduce((obj, key, i) => {
  obj[key] = key;
  outSrcExts[key].forEach(ext => obj[ext] = key);
  return obj;
}, {}); //?

// sources we have available
const srcFiles = [
  '/foo/bar/baz.scss',
  '/foo/bar/baz.pug',
  '/foo/bar/baz/$baz_item.pug',
  '/foo/bar/$baz_list/baz.pug',
  '/foo/bar/baz.js',
];

const dynReqSrcMap = srcFiles.reduce((map, srcFile) => {
  const srcExt = path.extname(srcFile);
  const isHTML = srcOutExts[srcExt] == '.html';
  const isDynamic = srcFile.match(/\/\$/);
  if (isHTML && isDynamic) {
    const pattern = srcFile.replace(new RegExp(`${srcExt}$`), '.html').replace(/\$/g, ':');
    const matcher = regexparam(pattern);
    map.set(matcher, srcFile);
  }
  return map;
}, new Map());


// dynMatcher
function dynMatch(reqPath) {
  const matchers = [...dynReqSrcMap.keys()];
  let match;
  const index = matchers.findIndex(matcher => (match = matcher.pattern.exec(reqPath)));
  if (!match) return null;
  return matchers[index].keys.reduce((obj, key, i) => {
    obj[key] = match[i + 1]
    return obj;
  }, {})
}

// incoming requests
const reqPaths = [
  '/foo/bar/baz.html',
  '/foo/bar/baz/something.html',
  '/not/foo/bar/baz/something.html',
  '/foo/bar/baz.css',
  '/foo/bar/baz.js',
  '/base/foo/bar/baz.html',
  '/base/foo/bar/baz.css',
  '/base/foo/bar/baz.js',
  '/base/fr/foo/bar/baz.html',
  '/base/de/foo/bar/baz.html',
];

const baseurl = '/base';
const locales = ['en', 'fr', 'de'];
const locale = 'en';

const baseRE = `^/(${baseurl.replace(/\//g, '')}/)?((${locales.slice(1).join('|')})/)?`; //?
const baseMatch = new RegExp(baseRE);

const normReqPaths = reqPaths.map(reqPath => {
  const locale = baseMatch.exec(reqPath)[2];
  return {
    locale: locale ? locale.slice(0, -1) : locale,
    route: reqPath.replace(baseMatch, '/')
  }
}); //?

normReqPaths.map(({ route }) => dynMatch(route)); //?
