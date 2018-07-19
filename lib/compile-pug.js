// node
const { relative, dirname } = require('path');
const { readFileSync } = require('fs');

// npm
const Pug = require('pug');
const grayMatter = require('gray-matter');

// local
const { pugLogger } = require('./logger');
const { htmlCssErr } = require('./errors');
const { replaceExt } = require('./utils');
const pugLocals = require('./util/pug-locals');
const { $data, $pages } = require('./locals.js');

const { bufferCache } = require('./cache.js');

// export
module.exports = function(srcDir, options) {
  const { isDev, isBuild } = options;
  function pugOptions(srcFile) {
    return {
      basedir: srcDir,
      pretty: isDev,
      filename: srcFile,
      filters: {},
    };
  }
  return class PugCompiler {
    constructor(srcFile) {
      this.srcFile = srcFile;
      this.depFiles = [];
      this.render();
    }

    render() {
      const { srcFile } = this;
      srcFile in bufferCache && delete bufferCache[srcFile];
      bufferCache[srcFile] = new Promise((resolve, reject) => {
        try {
          const { data: $page, content: pugStr } = grayMatter(readFileSync(srcFile, 'utf8'));
          const template = Pug.compile(pugStr, pugOptions(srcFile));
          this.depFiles = template.dependencies;
          resolve(template({ $data, $pages, $page, ...pugOptions}));
          pugLogger.debug(`Emitted: ${relative(srcDir, srcFile)}`);
        } catch(err) { reject(err); }
      }).catch(err => {
        if (isBuild) throw Error(err);
        pugLogger.error(err.toString());
        return err.toString();
      });
    }

    depcheck(absFile){
      pugLogger.debug('Checking dependencies');
      if (absFile == this.srcFile || ~this.depFiles.indexOf(absFile)) {
        pugLogger.debug(`Found dependency: ${absFile}`);
        this.render();
      }
    }
  }
}
