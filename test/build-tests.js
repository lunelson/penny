// /\.pug$/.test('/some/path/to/file.pug'); //?

// const filterFiles = require('filter-files');

// process.cwd();//?
// filterFiles.sync('.', (fp, dir, files, recurse) => {
//   console.log(recurse);
//   return /\.js$/.test(fp);
// }, true); //?

var recursiveRead = require('recursive-readdir');
var mm = require('micromatch');

const srcExts = ['.pug', '.scss', '.js'];
const srcRegExes = srcExts.reduce((obj, ext) => { obj[ext] = new RegExp(`\${ext}$`); return obj; }, {}); // eslint-disable-line quotes

var unFolders = ['!**/_*/**/*.*'];
var unFiles = ['!**/_*.*'];

[].concat(unFiles, unFolders);//?

const ignoreGlobs = [
  '!**/_*/**/*.*', // ignore _folder
  '!**/_*.*', // ignore _file
  '!**/node_modules/**/*', // Node
  '!**/.DS_Store', // macOS
  '!.DS_Store', // macOS
];

recursiveRead('.').then(files => {
  /* TODO
    - ignore anything in _folder or with _file name
    - ignore a basic blacklist: node_modules, .file ?
    - filter and reduce in one step
  */
  // mm(files, ['*']); //?
  const filtered = mm(files, ['**/*'].concat(ignoreGlobs));
  console.log(filtered);


  // const fileObj = files.filter((file) => {
  //   if (/node_modules/.test(file) || /^.git/.test(file)) return false;
  //   const last = file.split('/').slice(-1)[0];
  //   return !/^_/.test(last) && !/^\./.test(last);
  // }).reduce((obj, file) => {
  //   const srcExt = srcExts.find(ext => srcRegExes[ext].test(file));
  //   obj[srcExt||'other'] = obj[srcExt||'other'] || [];
  //   obj[srcExt||'other'].push(file);
  //   return obj;
  // }, {}); //?

  // console.log(fileObj);

});
