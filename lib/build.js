'use-strict';

// node
const path = require('path');

// npm
const chalk = require('chalk');
const write = require('write');
const del = require('delete');
const _ = require('lodash');
const rrddir = require('recursive-readdir');
const mmatch = require('micromatch'); // https://github.com/micromatch/micromatch
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
  const srcRenderFns = _.mapValues(srcOutExt, (outExt, srcExt) => require(`./render-${srcExt.slice(1)}`)({srcDir, options}));
  const srcOutReplacers = _.mapValues(srcOutExt, (outExt, srcExt) => {
    return function(str) { return str.replace(new RegExp(`\\${srcExt}$`), outExt); };
  });

  /*
    TODO
    - render to a temp directory; move everything in to place, only if it all worked

  */

  rrddir(srcDir).then(files => {

    /**
     * FILTERING
     */

    const filesBySrc = mmatch(files, ['**/*'].concat(ignoreGlobs))
      .reduce((obj, file) => {
        const srcExt = srcExts.find(ext => mmatch(file, extGlobs[ext]).length);
        obj[srcExt||'other'] = obj[srcExt||'other'] || [];
        obj[srcExt||'other'].push(path.relative(srcDir, file));
        return obj;
      }, {});

    /**
     * PROCESSING
     */

    const srcRenders = [].concat(...srcExts.map((ext) => {
      return filesBySrc[ext]
        .map((file) => srcRenderFns[ext](path.join(srcDir, file))
          .then((str) => write(path.join(outDir, srcOutReplacers[ext](file)), str))
          .catch((err) => {

            /**
             * ERRORS
             */

            console.log(err);
          })
        );
    }));

    const copies = filesBySrc['other'].map((file) => cp(path.join(srcDir, file), path.join(outDir, file)));

    Promise.all([...copies, ...srcRenders]).then(([...processed]) => {

      /**
       * SUCCESS
       */

      console.log(`processed ${processed.length} files`);
    });
  });
};
