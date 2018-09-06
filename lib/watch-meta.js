function dataWatch(baseDir) {
  const dataTreeSync = $dataSyncer(baseDir);
  console.dir({dataGlob});
  return function(onReady, onEvent) {
    return bsync.watch([dataGlob], {
      cwd: baseDir
    }, (fsEvent, relFile) => {
      pennyLogger.debug(`${fsEvent} $data: ${relFile}`);
      dataTreeSync(fsEvent, relFile);
      onEvent && onEvent(fsEvent, relFile);
    }).on('ready', onReady);
  };
}

function pageWatch(baseDir) {
  const pagesMapSync = $pagesSyncer(baseDir);
  return function(onReady, onEvent) {
    return bsync.watch([htmlSrcGlob], {
      // TODO: review; disallow only _file, not _folder/file ?
      ignored: ['**/node_modules/**', '_data/**', '**/_*.*'],
      cwd: baseDir
    }, (fsEvent, relFile) => {
      if (anymatch([junk.regex], basename(relFile))) return;
      if (!~fileEventNames.indexOf(fsEvent)) return;
      pennyLogger.debug(`${fsEvent} $page: ${relFile}`);
      pagesMapSync(fsEvent, relFile);
      onEvent && onEvent(fsEvent, relFile);
    }).on('ready', onReady);
  };
}
