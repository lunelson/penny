// node
const fs = require('fs');
const path = require('path');

// npm
const resolve = require('resolve'); // for implementing require in put
const grayMatter = require('gray-matter');
const pug = require('pug');
const Sass = require('node-sass');
const PostCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');

// local
const sassFns = require('./misc-sass.js');
const { markdown, markdownInline } = require('./misc-mdi.js');

function initPugOptions(srcDir, isDev) {
  return function(srcFile) {
    return {
      basedir: srcDir,
      cache: false,
      debug: false,
      doctype: 'html',
      filename: srcFile,
      globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
      name: false,
      pretty: isDev,
      self: false,
      filters: {
        markdown(str) {
          return '\n'+markdown(str);
        },
        ['markdown-inline'](str) {
          return '\n'+markdownInline(str);
        },
        scss(data, { filename:file }) {
          const { css, map, stats } = Sass.renderSync({
            data, file,
            includePaths: ['node_modules', '.', path.dirname(file)],
            outputStyle: 'nested',
            sourceMap: false,
            functions: sassFns(file)
          });
          return PostCSS([autoPrefixer({ browsers })]
            .concat(isDev?[]:[postCSSClean({})]))
            .process(css, { from: file, to: outFile, map: false })
            .css.toString();
        },
      }
    };
  };
}

const _ = require('lodash');
const _dayjs = require('dayjs');
const _moment = require('moment');
const _dateFns = require('date-fns');

const _faker = require('faker');
const _chance = new (require('chance'))();
const _casual = require('casual');

const write = require('write');
const readData = require('read-data');
const imageSize = require('image-size');
const filterFiles = require('filter-files');

function absolve(relPath) {
  return relPath[0] === '/' ? path.join(this.basedir, relPath) : path.resolve(this.dirname, relPath);
}

const boundFns = {

  require(relModule) {
    const srcModule = resolve.sync(relModule, { basedir: this.dirname });
    delete require.cache[srcModule];
    return require(srcModule);
  },
  renderMd(str){ return '\n'+markdown(str).trim(); },
  renderMdInline(str){ return '\n'+markdownInline(str).trim(); },
  renderMdFile(relFile){
    const absFile = absolve.call(this, relFile);
    const { content } = grayMatter(fs.readFileSync(absFile, 'utf8'));
    return '\n'+markdown(content).trim();
  },
  renderPug(str) {
    try {
      const compiler = pug.compile(str, this.options);
      this._depFiles = (this._depFiles || []).concat(compiler.dependencies);
      return '\n'+compiler(this).trim();
    } catch(err) { throw Error(err); }
  },
  renderPugFile(relFile) {
    const absFile = absolve.call(this, relFile);
    try {
      const compiler = pug.compileFile(absFile, this.options);
      this._depFiles = (this._depFiles || []).concat(compiler.dependencies);
      return '\n'+compiler(this).trim();
    } catch(err) { throw Error(err); }
  },
  writeFile(relFile, content) {
    const absFile = absolve.call(this, relFile);
    return write.sync(absFile, content);
  },
  writeFileIf(relFile, content) {
    const absFile = absolve.call(this, relFile);
    if (fs.existsSync(absFile)) return false;
    return write.sync(absFile, content);
  },
  readImage(relImg) {
    const absImg = absolve.call(this, relImg);
    return imageSize(absImg);
  },
  readMatter(relFile) {
    const absFile = absolve.call(this, relFile);
    return grayMatter.read(absFile);
  },
  readData(relFile) {
    const absFile = absolve.call(this, relFile);
    return readData.sync(absFile);
  },
  // readDir(relDir, ...opts) {
  //   const absDir = absolve.call(this, relDir);
  //   return filterFiles.sync(absDir, ...opts).map(absFile => path.relative(srcDir, absFile));
  // },
  dump(value, replacer = null, space = 2) { return JSON.stringify(value, replacer, space); },
};

function initPugLocals(srcDir, isDev) {
  return function(srcFile, options={}) {
    const locals = {

      // file info
      basedir: srcDir,
      filename: srcFile,
      get dirname() { return path.dirname(this.filename); },
      get basename() { return path.basename(this.filename); },
      get pathname() { return '/'+path.relative(this.basedir, this.filename).replace(/\.pug$/, '.html'); },

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
    };

    // binding functions
    Object.keys(boundFns).forEach((fn) => {
      locals[fn] = boundFns[fn].bind(locals);
    });

    // add any user-supplied locals, with check for name collisions
    return _.assignWith(locals, options, (objVal, srcVal, key, obj, src) => {
      if (key in obj && key in src) throw Error('[pug] locals: name-collision, with core property or method');
      return undefined;
    });
  };
}

module.exports = { initPugOptions, initPugLocals };
