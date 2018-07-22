function srcServer(srcExt) {
  const renderFn = require(`./render-${srcExt.slice(1)}`)({srcDir, loggerFn: loggerFn, options});
  return function(reqFile, res, next) {
    const srcFile = replaceExt(reqFile, srcExt); // 0.
    stat(srcFile, (err, stats) => { // 1.
      if (err || !stats.isFile()) return next(); // 2.
      res.setHeader('Cache-Control', 'no-cache'); // 3a.
      res.setHeader('Content-Type', srcContentTypes[srcExt]); // 3b.
      compiler.getStream().then(stream => stream.pipe(res));
    });
  };
}

class Compiler {
  constructor(file) {
    this.file = file;
    this.deps = [];
    this.dirty = true;
    this.cached = null;
  }
  getStream() {
    if (this.dirty || !this.cached) {
      this.cached = this.compile();
      this.dirty = false;
    }
    return this.cached;
  }
}

class JSCompiler extends Compiler {
  constructor(file) {
    super(file);
    this.compiler = webpack(webpackOptions);
    this.compiler.outputFileSystem = memoryFs;
    /*
      will I have to run this manually, the first time?
        or is there a watch option to have it run immediately?
      does a watchRun also fire the 'run' event?
        ie can I tap just 'run'

    */
    this.compiler.hooks.watchRun.tap('new run', (compiler, done) => {
      console.log('watch run was started');
      this.cached = new Promise((resolve, reject) => {
        compiler.hooks.afterEmit.tap('hook up', (compilation, done) => {
          resolve(memoryFs.createReadStream(this.file))
        });
      });
    });
    this.watcher = this.compiler.watch(watcherOptions);
  }
  compile() {
    return this.promise;
  }
  destroy() {
    this.watcher.close();
  }
}
