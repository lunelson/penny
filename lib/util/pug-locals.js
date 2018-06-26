//        _   _ _
//       | | (_) |
//  _   _| |_ _| |___ ______ _ __  _   _  __ _
// | | | | __| | / __|______| '_ \| | | |/ _` |
// | |_| | |_| | \__ \      | |_) | |_| | (_| |
//  \__,_|\__|_|_|___/      | .__/ \__,_|\__, |
//                          | |           __/ |
//                          |_|          |___/

/**
 * native imports
 */

const path = require('path');
const url = require('url');
const fs = require('fs');
const _ = require('lodash');
const resolve = require('resolve');

/**
 * package imports, unbound functions
 */

// MARKDOWN-IT
// see options https://markdown-it.github.io/markdown-it/#MarkdownIt.new
// see demo https://markdown-it.github.io/

const mdi = require('markdown-it')({ breaks: true })
  .use(require('markdown-it-block-image'))
  // .use(require('markdown-it-custom-block'))
  .use(require('markdown-it-attrs'))
  .use(require('markdown-it-mark'))
  .use(require('markdown-it-deflist'))
  .use(require('markdown-it-emoji'))
  .use(require('markdown-it-footnote'));

const matter = require('gray-matter');

const Sass = require('node-sass');
const sassFns = require('./sass-fns');
const PostCSS = require('postcss');
const postCSSClean = require('postcss-clean');
const autoPrefixer = require('autoprefixer');

const pug = require('pug');

const lodash = require('lodash');
const dateFns = require('date-fns');
const moment = require('moment');
const dayjs = require('dayjs');

const faker = require('faker');
const chance = new (require('chance'))();

const write = require('write');
const readData = require('read-data');
const imageSize = require('image-size');
const filterFiles = require('filter-files');

function markdown(str) {
  return '\n'+mdi.render(matter(str).content).trim(); }
function markdownInline(str) {
  return '\n'+mdi.renderInline(matter(str).content).trim(); }

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

function testFilter(str, options) {
  return JSON.stringify({ str, options });
}

/**
 * bound functions
 */

function absSrc(relFile) {
  return relFile[0] === '/' ? path.join(this.basedir, relFile) : path.resolve(this.dirname, relFile);
}

const boundFns = {

  filterFiles(relDir, ...opts) {
    const pathBase = relDir[0] === '/' ? this.basedir : this.dirname;
    const absDir = relDir[0] === '/' ? path.join(pathBase, relDir) : path.resolve(pathBase, relDir);
    return filterFiles.sync(absDir, ...opts).map(absFile => path.relative(pathBase, absFile));
  },
  imageSize(relImg) {
    const absImg = absSrc.call(this, relImg);
    return imageSize(absImg);
  },
  readData(relFile) {
    const absFile = absSrc.call(this, relFile);
    return readData.sync(absFile);
  },
  readContent(relFile) {
    const absFile = absSrc.call(this, relFile);
    return matter.read(absFile);
  },
  require(relFile) {
    const srcModule = resolve.sync(relFile, { basedir: this.dirname });
    delete require.cache[srcModule];
    return require(srcModule);
  },
  // require(relFile) {
  //   const absFile = absSrc.call(this, relFile);
  //   delete require.cache[absFile];
  //   return require(absFile);
  // },
  render(str, opts) {
    try { return pug.render(str, Object.assign({}, this, opts, { filename: this.filename })).trim(); }
    catch(err) { throw Error(err); }
  },
  renderFile(relFile, opts) {
    const absFile = absSrc.call(this, relFile);
    try { return pug.renderFile(absFile, Object.assign({}, this, opts, { filename: absFile })).trim(); }
    catch(err) { throw Error(err); }
  },
  writeFile(relFile, content) {
    const absFile = absSrc.call(this, relFile);
    // if (fs.existsSync(absFile)) return false;
    return write.sync(absFile, content);
  },
  writeFileIf(relFile, content) {
    const absFile = absSrc.call(this, relFile);
    if (fs.existsSync(absFile)) return false;
    return write.sync(absFile, content);
  }
};

// exports

module.exports = function pugLocals(options = {}) {

  const locals = {

    // path information
    get dirname() { return path.dirname(this.filename); },
    get basename() { return path.basename(this.filename); },
    get pathname() { return '/'+path.relative(this.basedir, this.filename).replace(/\.pug$/, '.html'); },
    get reqFile() { return '/'+path.relative(this.basedir, this.filename).replace(/\.pug$/, '.html'); },
    get reqDir() { return '/'+path.relative(this.basedir, this.dirname); },

    // functions
    path,
    _: lodash,
    lodash,
    faker,
    chance,
    dateFns,
    moment,
    dayjs,
    markdown,
    markdownInline,
    dump(value, replacer = null, space = 2) { return JSON.stringify(value, replacer, space); },

    // filters
    filters: { markdown, 'markdown-inline': markdownInline, scss, testFilter },

    // disabled/unneeded
    doctype: 'html',
    globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
    self: false,
    debug: false,
    cache: false,
    name: false
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
