module.exports = function(srcDir, pubDir, outDir, options) {

  return function(fileSet) {

  }
}

jsWatching = new Promise((resolve, reject) => {
  try { jsWatch(resolve); }
  catch(err) { reject(err); }
});

new Observable(observer => {
  jsWatch(
    // onReady passes watcher instance
    watcher => {
      watcher.close();
      observer.complete();
    },
    // onEvent passes srcFile
    srcFile => {
      observer.next(`starting ${srcFile}`)
    },
  );
});

let observable = new Observable(observer => {
  // Emit a single value after 1 second
  let timer = setTimeout(() => {
    observer.next('hello');
    observer.complete();
  }, 1000);

  // On unsubscription, cancel the timer
  return () => clearTimeout(timer);
});


Observable.from(list).subscribe(x => {
  console.log(x);
});

function getRelFiles(watcher) {
  const watched = watcher.getWatched();
  return Object.keys(watched)
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
}
