// npm
const fs = require('fs');
const path = require('path');
const resolve = require('resolve'); // for implementing require in put

// md, pug
const grayMatter = require('gray-matter');
const pug = require('pug');
const mdi = require('markdown-it')({
  // see options https://github.com/markdown-it/markdown-it#init-with-presets-and-options
  breaks: true,
})
  .use(require('markdown-it-block-image'))
  // .use(require('markdown-it-custom-block'))
  .use(require('markdown-it-attrs'))
  .use(require('markdown-it-mark'))
  .use(require('markdown-it-deflist'))
  .use(require('markdown-it-emoji'))
  .use(require('markdown-it-footnote'));

// sass, css
const Sass = require('node-sass');
const PostCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');
const sassFns = require('./misc-sass');

function markdown(str) {
  return '\n'+mdi.render(str).trim(); }
function markdownInline(str) {
  return '\n'+mdi.renderInline(str).trim(); }

// postcss(plugins).process(css).css
function scss(data, { filename:file }) {
  // return PostCSS([autoPrefixer({ /* browsers */ }), postCSSClean({})])
  //   .process(Sass.renderSync({
  //     data, file,
  //     includePaths: ['node_modules', '.', path.dirname(file)],
  //     outputStyle: 'nested',
  //     sourceMap: false,
  //     functions: sassFns(file)
  //   }).css).css.toString();

  return Sass
    .renderSync({
      data, file,
      includePaths: ['node_modules', '.', path.dirname(file)],
      outputStyle: 'nested',
      sourceMap: false,
      functions: sassFns(file)
    })
    .css.toString();
}

const filters = {
  scss,
  markdown,
  'markdown-inline': markdownInline,
};

function setOptionsMaker(srcDir, isDev) {
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

function markdown(str) {
  return '\n'+mdi.render(grayMatter(str).content).trim(); }
function markdownInline(str) {
  return '\n'+mdi.renderInline(grayMatter(str).content).trim(); }

const boundFns = {

  /*
  require
  renderMd
  renderMdInline
  renderMdFile
  renderPug
  renderPugFile -- should work like dynamic include
  writeFile
  readImage
  readMatter
  readData
  readDir
  */
  require(relModule) {
    const srcModule = resolve.sync(relModule, { basedir: this.dirname });
    delete require.cache[srcModule];
    return require(srcModule);
  },
  renderMd(str){ return '\n'+mdi.render(str).trim(); },
  renderMdInline(str){ return '\n'+mdi.renderInline(str).trim(); },
  renderMdFile(relFile){
    const absFile = absolve.call(this, relFile);
    const { content } = grayMatter(readFileSync(absFile, 'utf8'));
    return '\n'+mdi.render(content).trim();
  },
  renderPug(str) {
    try { return '\n'+pug.compile(str, this).trim(); }
    catch(err) { throw Error(err); }
  },
  renderPugFile(relFile) {
    const absFile = absolve.call(this, relFile);
    try { return '\n'+pug.compileFile(absFile, this).trim(); }
    catch(err) { throw Error(err); }
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
  readDir(relDir, ...opts) {
    const absDir = absolve.call(this, relDir);
    return filterFiles.sync(absDir, ...opts).map(absFile => path.relative(pathBase, absFile));
  },
  dump(value, replacer = null, space = 2) { return JSON.stringify(value, replacer, space); },
};

function setLocalsMaker(srcDir, isDev) {
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

module.exports = { filters, setOptionsMaker, setLocalsMaker }
