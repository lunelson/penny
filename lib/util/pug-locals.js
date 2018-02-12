//        _   _ _
//       | | (_) |
//  _   _| |_ _| |___ ______ _ __  _   _  __ _
// | | | | __| | / __|______| '_ \| | | |/ _` |
// | |_| | |_| | \__ \      | |_) | |_| | (_| |
//  \__,_|\__|_|_|___/      | .__/ \__,_|\__, |
//                          | |           __/ |
//                          |_|          |___/

// native imports

const path = require('path');
const url = require('url');
const fs = require('fs');
const _ = require('lodash');

// package imports, unbound functions

const jsTrans = require('jstransformer');
const mdi = jsTrans(require('jstransformer-markdown-it'));
const pug = require('pug');

const lodash = require('lodash');
const dateFns = require('date-fns');
const moment = require('moment');

const faker = require('faker');
const chance = new (require('chance'))();

const resolve = require('resolve');
const readYaml = require('read-yaml');
const imageSize = require('image-size');
const filterFiles = require('filter-files');

function markdown(str, opts) { return mdi.render(str, opts).body; }
function markdownInline(str, opts) { return mdi.render(str, Object.assign({inline: true}, opts)).body; }

// bound functions

/* TODO
  - add 'read' method, for JSON and YAML
  - differentiate 'render' and 'renderFile' methods for pug
*/

const boundFns = {

  dirList(relDir, ...opts) {
    const pathBase = relDir[0] === '/' ? this.basedir : this.dirname;
    const absDir = relDir[0] === '/' ? path.join(pathBase, relDir) : path.resolve(pathBase, relDir);
    return filterFiles.sync(absDir, ...opts).map(absFile => path.relative(pathBase, absFile)); },
  imgInfo(relImg) {
    const absImg = relImg[0] === '/' ? path.join(this.basedir, relImg) : path.resolve(this.dirname, relImg);
    return imageSize(absImg); },
  require(relFile) {
    const absFile = relFile[0] === '/' ? path.join(this.basedir, relFile) : path.resolve(this.dirname, relFile);
    if (absFile.match(/\.yml$|\.yaml$/)) return readYaml.sync(absFile);
    delete require.cache[absFile];
    return require(absFile);
  },
  render(relFile, opts) {
    const absFile = relFile[0] === '/' ? path.join(this.basedir, relFile) : path.resolve(this.dirname, relFile);
    try {
      const str = fs.readFileSync(absFile).toString();
      return pug.render(str, Object.assign({}, this, opts, { filename: absFile }));
    }
    catch(err) {
      throw Error(`[pug] include(): could not read file at '${absFile}`);
    }
  }

};

// exports

module.exports = function pugLocals(options = {}) {

  const locals = {

    get dirname() { return path.dirname(this.filename); },
    set dirname(n) { return undefined; },
    get reqpath() { return path.parse('/'+path.relative(this.basedir, this.filename).replace(/\.pug$/, '.html')); },
    set reqpath(n) { return undefined; },
    // get request() { return '/'+path.relative(this.basedir, this.filename).replace(/\.pug$/, '.html'); },
    // set request(n) { return undefined; },

    // functions
    _: lodash,
    lodash,
    faker,
    chance,
    dateFns,
    moment,
    markdown,
    markdownInline,
    dump(value, replacer = null, space = 2) { return JSON.stringify(value, replacer, space); },

    // filters
    filters: { markdown, markdownInline },

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
