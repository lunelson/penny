// built-in

const path = require('path');

// npm

const _ = require('lodash');
const rrdir = require('recursive-readdir');
const mm = require('micromatch'); // https://github.com/micromatch/micromatch
const cp = require('cp-file');
const write = require('write');
const junk = require('junk');

const loggerFn = require('eazy-logger').Logger({
  prefix: '[{blue:penny}] ',
  useLevelPrefixes: true
});

// const ignore = [
//   '**/_*/**/*.*', // _folder/file
//   '**/_*.*', // _file
//   '**/node_modules/**', // npm
// ];

const {
  extContentTypes,
  // Deferral,
  replaceExt,
  // removeExt,
  outSrcExts,
  srcOutExts,
  htmlSrcMatch,
  anySrcMatch,
  fileEventNames,
} = require('./misc-penny.js');

const compilerExts = ['.js'].concat(..._.values(outSrcExts));

module.exports = function (srcDir, outDir, options) {

  /*
    STEPS
    - identify outFiles vs srcFiles
    - perform on a temp directory:
      - copy all the outFiles
      - for each srcFile
        - trigger its compiler
        - stream the result from memory to a writeStream in temp
    - if everything worked
      - delete everything in dest, except keep_files paths
      - move temp files in to place
  */

  rrdir(srcDir).then(files => {

    /**
     * FILTERING
     */

    const filesByAction = mm(files, ['**/*'], {
      ignore: ['**/_*/**/*.*', '**/_*.*', '**/node_modules/**']
    })
      .filter(file => junk.not(path.basename(file)))
      .reduce((obj, file) => {
        const type = ~compilerExts.indexOf(path.extname(file)) ? 'src' : 'out';
        obj[type] = obj[type] || [];
        obj[type].push(path.relative(srcDir, file));
        return obj;
      }, {});

    console.log(filesByAction);

    // /**
    //  * PROCESSING
    //  */

    // const srcRenders = [].concat(...srcExts.map((ext) => {
    //   return filesBySrc[ext]
    //     .map((file) => srcRenderFns[ext](path.join(srcDir, file))
    //       .then((str) => write(path.join(outDir, srcOutReplacers[ext](file)), str))
    //       .catch((err) => {

    //         /**
    //          * ERRORS
    //          */

    //         console.log(err);
    //       })
    //     );
    // }));

    // const copies = filesBySrc['other'].map((file) => cp(path.join(srcDir, file), path.join(outDir, file)));

    // Promise.all([...copies, ...srcRenders]).then(([...processed]) => {

    //   /**
    //    * SUCCESS
    //    */

    //   console.log(`processed ${processed.length} files`);
    // });
  });
};
