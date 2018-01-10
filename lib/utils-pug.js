//        _   _ _
//       | | (_) |
//  _   _| |_ _| |___ ______ _ __  _   _  __ _
// | | | | __| | / __|______| '_ \| | | |/ _` |
// | |_| | |_| | \__ \      | |_) | |_| | (_| |
//  \__,_|\__|_|_|___/      | .__/ \__,_|\__, |
//                          | |           __/ |
//                          |_|          |___/

const jsTrans = require('jstransformer');
const markdownIt = jsTrans(require('jstransformer-markdown-it'));
const lodash = require('lodash');
// const filterFiles = require('filter-files');
// const imageSize = require('image-size');
// const pug = require('pug');

const path = require('path');
const url = require('url');
const fs = require('fs');

// function listFiles(dirpath, filterFn, recurse = true) {
//   const {filename,pathname,basedir,pretty} = this;
//   return JSON.stringify({filename,pathname,basedir,pretty}, null, 2);
//   dirpath = path.resolve(path.dirname(this.filename), dirpath);
//   return dirpath;
//   return filterFiles.sync(...(recurse ? [dirpath, filterFn] : dirpath, false, filterFn));
// }
// function getSizeOf(filepath) { return imageSize(filepath); }
// function pugRender(str, opts) { return pug.render(str, Object.assign({}, this, opts)); }
// function renderMarkdown(str, opts) { return markdownIt.render(str, opts).body; }
// function renderFile(filepath, opts) { }
// function include() {}
// function getThis() { return Object.keys(this); }

const pugLocals = {

  // will be set by process
  // filename: undefined,
  // pathname: undefined,
  // basedir: undefined,
  // pretty: undefined,

  // data functions
  lodash, _: lodash,
  dateFns: require('date-fns'),
  faker: require('faker'),
  chance: new (require('chance'))(),

  // file functions
  node: { require, path, url, fs },
  filterFiles: require('filter-files').sync,
  imageSize: require('image-size'),
  pugRender: require('pug').render,
  mdRender(str, opts) { return markdownIt.render(str, opts).body; },

  // filters
  filters: {
    'markdown': function (str, options) {
      return markdownIt.render(str, options, options).body;
    }
  },

  // permanent/disabled/unneeded
  doctype: 'html',
  globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
  self: false,
  debug: false,
  cache: false,
  name: false
};

// bound file functions
// pugLocals.getThis = getThis.bind(pugLocals);
// pugLocals.listFiles = listFiles.bind(pugLocals);
// pugLocals.getSizeOf = getSizeOf.bind(pugLocals);
// pugLocals.renderPug = renderPug.bind(pugLocals);
// pugLocals.renderMarkdown = renderMarkdown.bind(pugLocals);
// renderFile, // not ready
// include, // not ready


module.exports = {
  pugLocals
};
