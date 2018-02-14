'use-strict';

// node
const path = require('path');

// npm
const rr = require('recursive-readdir');
const mm = require('micromatch');

const srcExts = ['.pug', '.scss', '.js'];

const ignoreGlobs = [
  '!**/_*/**/*.*', // ignore _folder
  '!**/_*.*', // ignore _file
  '!**/node_modules/**/*', // Node
  '!**/.DS_Store', // macOS
  '!.DS_Store', // macOS
];

const extGlobs = {
  '.pug': ['**/*.pug'],
  '.html': ['**/*.html'],
  '.scss': ['**/*.scss'],
  '.css': ['**/*.css', '!**/*.min.css'],
  '.js': ['**/*.js', '!**/*.min.js'],
};

module.exports = function (srcDir, outDir, options) {

  const isDev = false;
  console.log(`
    BUILD
    from: ${srcDir}
    to:   ${outDir}
  `);

  rr(srcDir).then(files => {

    const filtered = mm(files, ['**/*'].concat(ignoreGlobs))
      .reduce((obj, file) => {
        const srcExt = srcExts.find(ext => mm(file, extGlobs[ext]).length);
        obj[srcExt||'other'] = obj[srcExt||'other'] || [];
        obj[srcExt||'other'].push(path.relative(srcDir, file));
        return obj;
      }, {});

    console.log(JSON.stringify(filtered, null, 2));

  });
};
