const path = require('path');
const chokidar = require('chokidar');

const watcher = chokidar.watch(['**/*'], {
  ignored: ['**/node_modules/**', '_data/**'],
  cwd: path.join(process.cwd(), 'test/penny/src')
});

watcher.on('all', (eventName, relFile) => {
  // console.log(eventName, relFile);
});

/*

    .add(path / paths): Add files, directories, or glob patterns for tracking. Takes an array of strings or just one string.
    .on(event, callback): Listen for an FS event. Available events: add, addDir, change, unlink, unlinkDir, ready, raw, error, all
    .unwatch(path / paths): Stop watching files, directories, or glob patterns. Takes an array of strings or just one string.
    .close(): Removes all listeners from watched files.
    .getWatched(): Returns an object representing all the paths on the file system being watched by this FSWatcher instance

*/
watcher.on('ready', () => {
  watcher.add('/Users/lunelson/Downloads/Postdawn.scss');
  watcher.add('/Users/lunelson/Git/packages/penny/test/penny/src/_root/pug/read-sources/demo.scss');
  setTimeout(() => {
    const watchedObj = watcher.getWatched(); //?
    const watchedArr = Object.keys(watchedObj).reduce((arr, relDir) => {
      arr.push(...watchedObj[relDir].map(basename => path.resolve(watcher.options.cwd, relDir, basename)));
      return arr;
    },[]);
    console.log(watchedArr);
    watcher.close();
  }, 3000);
});

// function chokiPromise(glob, opts, allHandler) {
//   return new Promise((resolve, reject) => {
//     try {
//       const watcher = chokidar.watch(glob, opts);
//       watcher.on('all', allHandler);
//       watcher.on('ready', () => {
//         const watchedObj = watcher.getWatched();
//         const watchedArr = Object.keys(watchedObj).reduce((arr, dirname) => {
//           arr.push(...watchedObj[dirname].map(file => path.join(dirname, file)))
//           return arr;
//         },[]);
//         resolve([watcher, watchedArr]);
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// }

// let ready = false;
// chokiPromise(['**/*'], {
//   ignored: ['**/node_modules/**', '_data/**'],
//   cwd: path.join(__dirname, 'test/penny/src')
// }, (eventName, relFile) => {
//   ready && console.log(eventName, relFile);
// }).then(([watcher, watched]) => {
//   ready = true;
//   watcher.add('_root/_hide/fail/scss/shit');
//   watcher.close();
// });
