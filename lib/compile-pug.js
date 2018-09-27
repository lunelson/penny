// node
const { relative, dirname } = require('path');
const { readFileSync } = require('fs');

// npm
const _ = require('lodash');
const Pug = require('pug');
const grayMatter = require('gray-matter');
const toStream = require('to-readable-stream');

// local
const { pugLogger } = require('./loggers');
const { htmlCssErr } = require('./errors');
const { initPugOptions } = require('./misc-pug.js');
const initPugFunctions = require('./functions-pug.js');
const SrcCompiler = require('./compile-src.js');
const { $data, $pages } = require('./watch-meta.js');
// export
module.exports = function(srcDir, pubDir, options, depReporter) {

  const { isDev } = options;

  const setOptions = initPugOptions(srcDir, pubDir, options);
  const setLocals = initPugFunctions(srcDir, pubDir, options);

  return class PugCompiler extends SrcCompiler {

    constructor(srcFile) {
      super(srcFile);
      this.pathname = '/'+relative(srcDir, srcFile).replace(/\.pug$/, '.html');
      this.options = setOptions(this.srcFile, this.depFiles); // includes filters
      this.locals = setLocals(this.srcFile, this.depFiles);
    }

    reset() {
      pugLogger.debug('resetting compiler');
      delete this.template;
      delete this.outCache;
    }

    error(err) {
      if (!isDev) throw Error(err);
      pugLogger.error(err.message);
      return toStream(htmlCssErr(err.message));
    }

    stream() {
      try {
        if (!('template' in this)) {
          const { srcFile, pathname } = this;
          const { data, content } = grayMatter(readFileSync(srcFile, 'utf8'));
          pugLogger.debug('re-compiling template');
          this.$page = Object.assign({ pathname }, data);
          this.template = Pug.compile(content, this.options);

          // only reset depFiles if compilation worked !!
          this.depFiles.length = 0;
          this.depFiles.push(this.srcFile, ...this.template.dependencies);
          depReporter(this.depFiles);
          pugLogger.debug(`depFiles added to watch: ${this.depFiles.length}`);
        }
        if (!('outCache' in this)) {
          const { $page, options: $options, locals } = this;

          // throw error if any errors in $data|$pages; TODO: make this better
          if ($data._errors.size) { throw new Error('error in $data'); }
          if ($pages._errors.size) { throw new Error('error in $pages'); }

          pugLogger.debug('re-rendering outCache');
          this.outCache = this.template(_.assign(locals, { $options, $data, $page, $pages: _.values($pages) }));
        }
        return toStream(this.outCache);
      } catch(err) { return this.error(err); }
    }
  };
};
