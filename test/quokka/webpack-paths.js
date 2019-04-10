const path = require('path');

// let options = {
//   srcDir: '/user/project/src',
//   outDir: '/user/project/out',
//   pubDir: '/user/project/src/_root',
// };

// let { srcDir, outDir, pubDir } = options;
// let srcFile;
// let subDir;
// let config;


// srcFile = '/user/project/src/_root/foo/bar.js';
// subDir = path.dirname(path.relative(pubDir, srcFile));
// config = {
//   entry: srcFile,
//   output: {
//     filename: path.basename(srcFile),
//     path: path.join(outDir, subDir),
//     publicPath: subDir.length > 1 ? `/${subDir}/` : '/'
//   }
// };//?

// srcFile = '/user/project/src/_root/baz.js';
// subDir = path.dirname(path.relative(pubDir, srcFile));
// config = {
//   entry: srcFile,
//   output: {
//     filename: path.basename(srcFile),
//     path: path.join(outDir, subDir),
//     publicPath: subDir.length > 1 ? `/${subDir}/` : '/'
//   }
// };//?

let options = {
  srcDir: '/user/project/src',
  outDir: '/user/project/out',
  pubDir: '/user/project/src',
};

let { srcDir, outDir, pubDir } = options;
let srcFile;
let subDir;
let config;

let baseUrl = 'project/';

path.resolve('/',baseUrl, 'foo/bar')//?


srcFile = '/user/project/src/foo/bar.js';
subDir = path.dirname(path.relative(pubDir, srcFile));
config = {
  entry: srcFile,
  output: {
    filename: path.basename(srcFile),
    path: path.join(outDir, subDir),
    publicPath: path.resolve('/', baseUrl, subDir)+'/'
  }
};//?

srcFile = '/user/project/src/baz.js';
subDir = path.dirname(path.relative(pubDir, srcFile));
config = {
  entry: srcFile,
  output: {
    filename: path.basename(srcFile),
    path: path.join(outDir, subDir),
    publicPath: path.resolve('/', baseUrl, subDir)+'/'
  }
};//?
