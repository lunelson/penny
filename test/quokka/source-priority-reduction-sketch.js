const path = require('path');

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

const reqTests = [
  '/foo/bar/baz.css',
  '/foo/bar/baz.html',
  '/foo/bar/baz.js',
];

reqTests.forEach(reqFile => {
  // what is requested
  reqFile;
  // is it a valid src type
  const outExt = path.extname(reqFile); //?
  const srcExts = outSrcExts[outExt]; //?
  if (!!srcExts/* ? */) {
    // if it's valid, what do we look for
    const searchFiles = [outExt].concat(srcExts).map(srcExt => reqFile.replace(new RegExp(`${outExt}$`), srcExt)); //?
    /*
      when you find a srcFile, you look up the compiler via srcOutExts !
     */
  }
})
