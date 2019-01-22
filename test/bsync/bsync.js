const bsync = require('browser-sync').create();

bsync.init({
  notify: false,
  open: false,
  server: { baseDir: 'test' },
  // watch: true,
  files: [{ match: 'test/**/*', fn: function(event, file) {
    console.log(event, file);
    bsync.reload(`/${file.replace(/\.pug$/, '.html')}`)
  } }],


  https: true,
  online: false,


  // logConnections: true,
  logFileChanges: true,




  // logLevel,
  // logPrefix: 'penny',
  // minify: !isDev,
  // middleware: [ serveFavicon, logger, srcController ]
// },
// function () {
//   let ready = false;
//   bsync
//     .watch(
//       // TRYME: remove srcDir from path; add as `cwd` option to chokidar ${srcDir}/
//       srcExts.concat(['.json', '.yml', '.yaml']).map(srcExt => `**/*${srcExt}`), {
//         ignored: ['**/node_modules/**'],
//         ignoreInitial: true,
//         cwd: srcDir
//       },
//       (event, file) => {
//         if (ready) {
//           const srcExt = extname(file);
//           const outExt = srcOutExt[srcExt] || '';
//           changeTimes[srcExt] = Date.now();
//           bsync.reload(`*${outExt}`);
//         }
//       }
//     )
//     .on('ready', () => (ready = true));
});
