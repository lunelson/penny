const srcContentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.scss': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.pug': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

const reqSrcExt = { // TODO: pluralize
  '.html': '.pug',
  '.css': '.scss',
  '.js': '.js'
};

function replaceExt(filepath, ext) {
  return filepath.trim().replace(new RegExp(`${extname(filepath)}$`), ext);
}

const { readFile } = require('fs');
const { parse } = require('url');
const { extname, join } = require('path');

const srcDir = '/foo/bar'

function mware(req, res, next = () => 'next') {
  let { pathname } = parse(req);
  /*
  catch bad paths here with the same mmatch patters as in build.js (should be disable-able with option)
  res.statusCode(403)
  res.statusMessage('Forbidden')
  res.end('This request path contains an underscore-prefixed folder or file. These are not served or built by Penny.')
  */
  let reqExt = extname(pathname);
  if (!reqExt) { reqExt = '.html'; pathname = pathname.replace(/\/$/, '/index') + reqExt; }
  if (!~['.html', '.css', '.js'].indexOf(reqExt)) { return next(); }
  else {
    const reqFile = join(srcDir, pathname);
    // return srcServerFns[reqSrcExt[ext]](reqFile, res, next);
    const srcExt = reqSrcExt[reqExt];
    const srcFile = replaceExt(reqFile, srcExt); // 0.
    readFile(srcFile, (err, data) => { // 1.
      if (err) return next(); // 2.
      res.setHeader('Content-Type', srcContentTypes[srcExt]); // 3.
      return srcCompilers[srcExt][srcFile].then(res.end);
    });
  }
}

parse('https://medium.com/webpack/webpack-4?dkd'); //?
mware('/medium.com/webpack/?dkd'); //?
mware('/medium.com/webpack?dkd'); //?
mware('/medium.com/test.css?dkd'); //?
mware('/medium.com/test.js?dkd'); //?
