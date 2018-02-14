'use-strict';

// node
const path = require('path');

// npm
const chalk = require('chalk');
const write = require('write');
const del = require('delete');
const _ = require('lodash');
const rr = require('recursive-readdir');
const mm = require('micromatch'); // https://github.com/micromatch/micromatch
const cp = require('cp-file');



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

  const { reqSrcExt } = options;
  const srcOutExt = _.invert(reqSrcExt);
  const srcExts = Object.keys(srcOutExt);
  const srcRenderFns = _.mapValues(srcOutExt, (out, src) => require(`./render-${src.slice(1)}`)(srcDir, false, options));
  // const changeTimes = _.mapValues(srcOutExt, Date.now);
  // const sourceWares = _.mapValues(srcOutExt, (outExt, srcExt) => {
  //   return require(`./lib/serve-${srcExt.slice(1)}.js`)(srcDir, isDev, changeTimes, options);
  // });

  console.log(`
    BUILDING
    from: ${srcDir}
    to:   ${outDir}
  `);

  rr(srcDir).then(files => {

    // FILTERING

    const filesBySrc = mm(files, ['**/*'].concat(ignoreGlobs))
      .reduce((obj, file) => {
        const srcExt = srcExts.find(ext => mm(file, extGlobs[ext]).length);
        obj[srcExt||'other'] = obj[srcExt||'other'] || [];
        obj[srcExt||'other'].push(path.relative(srcDir, file));
        return obj;
      }, {});

    console.log(JSON.stringify(filesBySrc, null, 2));

    // PROCESSING

    const scssRenders = filesBySrc['.scss']
      .map((file) => srcRenderFns['.scss'](file)
        .then((str) => write(path.join(outDir, file.replace(/\.scss$/, '.css')), str))
      );

    Promise.all(scssRenders).then((results) => {

    });
    // const copies = filtered.other.map((file) => cp(path.join(srcDir, file), path.join(outDir, file)));
    // Promise.all([...copies]).then(([...processed]) => console.log(`processed ${processed.length} files`));


  });
};
