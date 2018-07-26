const path = require('path');

module.exports = function(srcDir) {

  function absolve(relPath) {
    return relPath[0] === '/' ?
      path.join(this._basedir, relPath) :
      path.resolve(path.dirname(this._filename), relPath);
  }

  class PugFns {
    constructor(srcFile) {
      this._basedir = srcDir;
      this._filename = srcFile;
    }
    get pathname() { return '/'+path.relative(this.srcDir, this.srcFile).replace(/\.pug$/, '.html'); }

    // get dirname() { return path.dirname(this.srcFile); }
    // get basename() { return path.basename(this.srcFile); },

    require(relModule) {
      const srcModule = resolve.sync(relModule, { basedir: srcDir });
      delete require.cache[srcModule];
      return require(srcModule);
    }
    renderMd(str){ return '\n'+markdown(str).trim(); }
    renderMdInline(str){ return '\n'+markdownInline(str).trim(); }
    renderMdFile(relFile){
      const absFile = absolve.call(this, relFile);
      const { content } = grayMatter(fs.readFileSync(absFile, 'utf8'));
      return '\n'+markdown(content).trim();
    }
    renderPug(str) {
      try {
        const compiler = pug.compile(str, this.options);
        this._depFiles = (this._depFiles || []).concat(compiler.dependencies);
        return '\n'+compiler(this).trim();
      } catch(err) { throw Error(err); }
    }
    renderPugFile(relFile) {
      const absFile = absolve.call(this, relFile);
      try {
        const compiler = pug.compileFile(absFile, this.options);
        this._depFiles = (this._depFiles || []).concat(compiler.dependencies);
        return '\n'+compiler(this).trim();
      } catch(err) { throw Error(err); }
    }
    writeFile(relFile, content) {
      const absFile = absolve.call(this, relFile);
      return write.sync(absFile, content);
    }
    writeFileIf(relFile, content) {
      const absFile = absolve.call(this, relFile);
      if (fs.existsSync(absFile)) return false;
      return write.sync(absFile, content);
    }
    readImage(relImg) {
      const absImg = absolve.call(this, relImg);
      return imageSize(absImg);
    }
    readMatter(relFile) {
      const absFile = absolve.call(this, relFile);
      return grayMatter.read(absFile);
    }
    readData(relFile) {
      const absFile = absolve.call(this, relFile);
      return readData.sync(absFile);
    }
    // readDir(relDir, ...opts) {
    //   const absDir = absolve.call(this, relDir);
    //   return filterFiles.sync(absDir, ...opts).map(absFile => path.relative(srcDir, absFile));
    // }
    dump(value, replacer = null, space = 2) { return JSON.stringify(value, replacer, space); }
  };
  _.assign(PugFns, {
    // data manipulation
    _faker,
    _chance,
    _casual,

    // data manipulation
    _,
    _dayjs,
    _moment,
    _dateFns,

    // node core
    _fs:fs,
    _path:path,

    // filters
    markdown: markdown,
    markdownInline: markdownInline,
  });

  return PugFns;
};
