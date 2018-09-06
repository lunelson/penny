function srcWatch(srcDir, pubDir, options) {

  const MdCompiler = require('./compile-md.js')(srcDir, pubDir, options);
  const PugCompiler = require('./compile-pug.js')(srcDir, pubDir, options);
  const ScssCompiler = require('./compile-scss.js')(srcDir, pubDir, options);

  return function(onReady, onEvent) {
    return bsync.watch(['**/*'], {
      ignored: ['**/node_modules/**', '_data/**'],
      cwd: srcDir
    }, (fsEvent, relFile) => {
      // check for easy rejections
      if (!~fileEventNames.indexOf(fsEvent)) return;
      if (anymatch([junk.regex], basename(relFile))) return;
      // re-resolve srcFile and relFile
      const srcFile = join(srcDir, relFile);
      relFile = relative(pubDir, srcFile); // !! reset wrt pubDir !!
      // proceed ->
      const isCompilable = anymatch([allSrcGlob], relFile);
      const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relFile);
      if (isCompilable && !isHidden) {
        pennyLogger.debug(`${fsEvent} src: ${relFile}`);
        if (fsEvent == 'unlink') { srcCompilers.delete(srcFile); }
        else if (!srcCompilers.has(srcFile)) {
          let valid = true;
          let srcExt = extname(relFile);
          if (~mdExts.indexOf(srcExt)) {
            srcExt = '.md';
            const { data } = grayMatter(readFileSync(srcFile, 'utf8'));
            if (!('layout' in data)) valid = false;
          }
          if (valid) {
            const SrcCompiler = {
              '.md': MdCompiler,
              '.pug': PugCompiler,
              '.scss': ScssCompiler
            }[srcExt];
            srcCompilers.set(srcFile, new SrcCompiler(srcFile));
            return;
          }
        }
      }
      onEvent && onEvent(srcFile);
    }).on('ready', onReady);
  };
}
