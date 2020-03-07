// node
const { relative, resolve } = require('path');
const { readFileSync } = require('fs');
const Pug = require('pug');

// npm
const _ = require('lodash');
const grayMatter = require('gray-matter');
const stripIndent = require('strip-indent');
const toStream = require('to-readable-stream');

// local
const { mdLogger } = require('./loggers');
const { $data, $pages } = require('./watch-meta.js');

// export
module.exports = function (srcDir, pubDir, options, depReporter) {

  const mdi = require('./config-markdown-it.js')(options);
  const PugCompiler = require('./compile-pug.js')(srcDir, pubDir, options, depReporter);

  return class MdCompiler extends PugCompiler {

    constructor(srcFile) {
      super(srcFile);
      this.route = '/' + relative(pubDir, srcFile).replace(/\.md$/, '.html');
    }

    source() {
      const {
        data,
        data: { layout: layoutPath },
        content,
      } = grayMatter(readFileSync(this.srcFile, 'utf8'));
      return {
        data,
        mdContent: content,
        pugContent: `extends ${layoutPath}\nblock content\n  !=_html`
      };
    }

    renderMD() {
      const { $page: { mixins: mixinsPath }, markdown, options, locals, depFiles, srcFile } = this;
      return mdi.render(markdown.replace(/\[\[\[([\s\S]+?)\]\]\]/gm, (match, group, offset, src) => {
        const includeMixins = `${mixinsPath ? `include ${mixinsPath}\n`:''}`;
        const template = Pug.compile(`${includeMixins}${stripIndent(group)}`, options);
        depFiles.push(resolve(srcFile, mixinsPath), ...template.dependencies);
        depReporter(this.depFiles);
        mdLogger.debug(`depFiles added to watch via mixins: ${this.depFiles.length}`);
        return template(locals);
      }));
    }

    stream() {
      try {
        if (!('template' in this)) {
          mdLogger.debug('re-compiling template');
          const { route } = this;
          const { data, pugContent, mdContent } = this.source();
          this.$page = Object.assign({ route }, data);
          this.template = Pug.compile(pugContent, this.options);
          this.markdown = mdContent;
          // only reset depFiles if compilation worked !!
          this.depFiles.length = 0;
          this.depFiles.push(this.srcFile, ...this.template.dependencies);
          depReporter(this.depFiles);
          mdLogger.debug(`depFiles added to watch via layout: ${this.depFiles.length}`);
        }
        if (!('outCache' in this)) {
          const { $page, options: $options, locals } = this;

          if ($data._errors.size) { throw new Error('error in $data'); }
          if ($pages._errors.size) { throw new Error('error in $pages'); }
          mdLogger.debug('re-rendering outCache');
          _.assign(locals, { $options, $data, $page, $pages: _.values($pages) });
          locals._html = this.renderMD(locals);
          this.outCache = this.template(locals);
        }
        return toStream(this.outCache);
      } catch (err) { return this.error(err); }
    }
  };
};
