// built-in

const path = require('path');
const { basename, extname } = path;
const fs = require('fs');

// npm

const _ = require('lodash');
const rrdir = require('recursive-readdir');
const mm = require('micromatch'); // https://github.com/micromatch/micromatch
const cp = require('cp-file');
const del = require('del');
const junk = require('junk');
const write = require('write');
const toStream = require('to-readable-stream');
const Listr = require('listr');
const delay = require('delay');
const anymatch = require('anymatch');
// local

const { pennyLogger } = require('./loggers.js');
const { bufferCache, memoryFs, } = require('./compile-js.js');
const { dataWatch: dataWatchSetup, pageWatch: pageWatchSetup, } = require('./watch-meta.js');
const { srcWatch: srcWatchSetup, srcCompilers, } = require('./watch-src.js');
const { jsWatchSetup, } = require('./watch-js.js');


const { outSrcExts, srcExts, } = require('./misc-penny.js');
const compilerExts = ['.js'].concat(..._.values(outSrcExts));

module.exports = function (srcDir, pubDir, outDir, options) {

  /*
    STEPS
    - start up data and page watchers -> syncing
    - start up src and js watchers -> compilers
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

  // get options; set/exec stuff if needed
  const { logLevel, useHTTPS, isDev } = options;

  const dataWatch = dataWatchSetup(srcDir);
  const pageWatch = pageWatchSetup(pubDir);
  const srcWatch = srcWatchSetup(srcDir, pubDir, options);
  const jsWatch = jsWatchSetup(srcDir, pubDir, outDir, options);

  let dataWatching, pageWatching, jsWatching, srcWatching, allWatchers;


  /*
        for JS files, **just let the compiler output them**
        reduce srcFiles in to object sorted by type
        output src files, streaming compiler to write stream in outDir -> array of promises
        reduce srcFiles in to second object by type, diff against first
        output any additional src files, streaming to outDir -> array of promises
        return [...srcWrites, ...newSrcWrites]
      */

  new Listr([
    {
      title: 'compile javascript; collect meta-data',
      task(ctx, task) {
        return new Listr([
          {
            title: 'collect meta-data',
            task(ctx, task) {

              dataWatching = new Promise((resolve, reject) => {
                try { dataWatch(resolve); }
                catch(err) { reject(err); }
              });

              pageWatching = new Promise((resolve, reject) => {
                try { pageWatch(resolve); }
                catch(err) { reject(err); }
              });

              return Promise.all([ dataWatching, pageWatching ]);
            }
          },
          {
            title: 'compile JS files',
            task(ctx, task) {

              jsWatching = new Promise((resolve, reject) => {
                try { jsWatch(resolve); }
                catch(err) { reject(err); }
              });

              return jsWatching;
            }
          },
        ], { concurrent: true });
      }
    },
    {
      title: 'compile SRC files',
      task(ctx, task) {
        srcWatching = new Promise((resolve, reject) => {
          try { srcWatch(resolve); }
          catch (err) { reject(err); }
        });

        const srcWriting = srcWatching.then(watcher => {
          const watched = watcher.getWatched();
          const relFiles = Object.keys(watched)
            .reduce((arr, relDir) => {
              arr.push(...watched[relDir].map(baseName => {
                const absFile = path.resolve(watcher.options.cwd, relDir, baseName);
                return path.relative(pubDir, absFile);
              }));
              return arr;
            },[])
            .filter(relFile => (
              junk.not(path.basename(relFile)) &&
              !anymatch(['**/_*/**/*', '**/_*'], relFile)
            ))
            .reduce((obj, relFile) => {
              const ext = path.extname(relFile);
              if (ext == '.js') return obj;
              const type = ~srcExts.indexOf(ext) ? 'src' : 'other';
              obj[type] = obj[type] || [];
              obj[type].push(relFile);
              return obj;
            }, {});

          console.log(relFiles);

        }).then(srcFiles => {
        });
        return delay(1000);
      }
    },
    {
      title: 'compile added SRC files',
      enabled(ctx) { return ctx.addedSrcFiles == true; },
      task(ctx, task) { return delay(1000); }
    },
    {
      title: 'cleaning up',
      task(ctx, task) {

        return delay(1000);
      }
    }
  ]).run().catch(console.error);



  // const srcWriting = srcWatching.then(watcher => {

  // }).then(writings => {
  //   Promise.all(writings).then(() => {
  //     allWatchers.forEach(watcher => watcher.close());
  //     pennyLogger.info('success');
  //     /* eslint-disable */
  //     process.exit(0);
  //     /* eslint-enable */
  //   });
  // }).catch(err => pennyLogger.error(err.toString())); // catchAll catch!!

  // Promise.all();

  // Promise.all([ dataWatching, pageWatching, srcWatching, jsWatching ])
  //   .then((watchers) => {

  //     allWatchers = watchers;
  //     // const [ , , srcWatcher, jsWatcher ] = allWatchers;
  //     const [ , , srcFiles, jsFiles ] = allWatchers.map(watcher => {
  //       const watchedObj = watcher.getWatched(); //?
  //       return Object.keys(watchedObj).reduce((arr, relDir) => {
  //         arr.push(...watchedObj[relDir].map(basename => path.resolve(watcher.options.cwd, relDir, basename)));
  //         return arr;
  //       },[]);
  //     });

  //   }).catch(err => pennyLogger.error(err.toString())); // catchAll catch!!


};
