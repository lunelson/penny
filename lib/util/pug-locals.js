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

// package imports, unbound functions

const jsTrans = require('jstransformer');
const mdi = jsTrans(require('jstransformer-markdown-it'));
const pug = require('pug');

const lodash = require('lodash');
const dateFns = require('date-fns');

const faker = require('faker');
const chance = new (require('chance'))();

const resolve = require('resolve');
const imageSize = require('image-size');
const filterFiles = require('filter-files');

function markdown(str, opts) { return mdi.render(str, opts).body; }

// bound functions
const boundFns = {

  dirList(relDir, ...opts) { return filterFiles.sync(path.join(this.dirname, relDir), ...opts); },
  imgInfo(imgFile) { return imageSize(path.join(this.dirname, imgFile)); },

  require(relFile) {
    const modulePath = resolve.sync(relFile, { basedir: this.dirname });
    delete require.cache[modulePath];
    return require(modulePath);
  },
  include(relFile, opts) {
    const absFile = path.join(this.dirname, relFile);
    try {
      const str = fs.readFileSync(absFile).toString();
      return pug.render(str, Object.assign(this, opts, {
        filename: absFile,
        dirname: path.dirname(absFile),
        relFilename: path.relative(this.basedir, absFile),
        pathname: `/${path.relative(this.basedir, absFile).replace(/\.pug$/, '.html')}`
      }));
    }
    catch(err) {
      throw Error(`[pug] include(): could not read file at '${absFile}`);
    }
  }

};

// exports

module.exports = function pugLocals() {

  const locals = {

    // functions
    _: lodash,
    lodash,
    faker,
    chance,
    dateFns,
    markdown,
    dump(value) { return JSON.stringify(value, null, 2); },

    // filters
    filters: { markdown },

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

  return locals;
};
