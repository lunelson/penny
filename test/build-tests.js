/\.pug$/.test('/some/path/to/file.pug'); //?

const filterFiles = require('filter-files');

process.cwd();//?
filterFiles.sync('.', (fp, dir, files, recurse) => {
  console.log(recurse);
  return /\.js$/.test(fp);
}, true); //?

var recursiveRead = require('recursive-readdir');

const srcExts = ['.pug', '.scss', '.js'];
const srcRegExes = srcExts.reduce((obj, ext) => { obj[ext] = new RegExp(`\${ext}$`); return obj; }, {}); // eslint-disable-line quotes

recursiveRead('.').then(files => {
  /* TODO
    - ignore anything in _folder or with _file name
    - ignore a basic blacklist: node_modules, .file ?
    - filter and reduce in one step
  */
  const fileObj = files.filter((file) => {
    if (/node_modules/.test(file) || /^.git/.test(file)) return false;
    const last = file.split('/').slice(-1)[0];
    return !/^_/.test(last) && !/^\./.test(last);
  }).reduce((obj, file) => {
    const srcExt = srcExts.find(ext => srcRegExes[ext].test(file));
    obj[srcExt||'other'] = obj[srcExt||'other'] || [];
    obj[srcExt||'other'].push(file);
    return obj;
  }, {}); //?

  console.log(fileObj);
  // const pugFiles = files.filter((fp, dir, files, recurse) => /\.pug$/.test(fp)); //?
  // const scssFiles = files.filter((fp, dir, files, recurse) => /\.scss$/.test(fp)); //?
  // const jsFiles = files.filter((fp, dir, files, recurse) => /\.js$/.test(fp)); //?
});
