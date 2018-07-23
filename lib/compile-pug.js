// node
const { relative, dirname } = require('path');
const { readFileSync } = require('fs');

// npm
const Pug = require('pug');
const grayMatter = require('gray-matter');

// local
const { pugLogger } = require('./loggers');
const { htmlCssErr } = require('./errors');
// const { replaceExt } = require('./utils');
// const pugLocals = require('./util/pug-locals');

const { $data, $pages } = require('./locals.js');
const { bufferCache } = require('./caches.js');

// export
module.exports = function(srcDir, options) {

  const { isDev, isBuild } = options;
  const { filters, setLocalsMaker, setOptionsMaker } = require('./misc-pug.js');

  const setOptions = setOptionsMaker(srcDir, isDev);
  const setLocals = setLocalsMaker(srcDir, isDev);

  return class PugCompiler {
    constructor(srcFile) {
      this.srcFile = srcFile;
      // this.depFiles = [];
      this.data = null;
      // this.content = null;
      this.template = null;
      this.render();
    }

    render() {
      const { srcFile } = this;
      srcFile in bufferCache && delete bufferCache[srcFile];
      const options = setOptions(srcFile);
      const locals = setLocals(srcFile);
      bufferCache[srcFile] = new Promise((resolve, reject) => {
        if (!this.template) try {
          const { data, content } = grayMatter(readFileSync(srcFile, 'utf8'));
          this.data = data;
          this.template = Pug.compile(content, {...options, ...filters});
          // this.depFiles = this.template.dependencies;
        } catch(err) { return reject(err); }
        pugLogger.debug(`Emitting: ${relative(srcDir, srcFile)}`);
        return resolve(this.template({ $data, $pages, $page: this.data, $options: options, ...locals}));
      }).catch(err => {
        if (isBuild) throw Error(err);
        pugLogger.error(err);
        return htmlCssErr(err);
      });
    }

    depcheck(absFile){
      pugLogger.debug('Checking dependencies');
      if (absFile == this.srcFile || ~this.template.dependencies.indexOf(absFile)) {
        pugLogger.debug(`Found dependency: ${absFile}`);
        this.template = null;
        this.render();
      }
    }
  }
}
