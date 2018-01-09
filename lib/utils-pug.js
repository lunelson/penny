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
const filterFiles = require('filter-files');
const imageSize = require('image-size');
const pug = require('pug');

function listFiles(...argz) { return filterFiles.sync(...argz); }
function getSizeOf(filepath) { return imageSize(filepath); }
function renderPug(str, opts) { return pug.render(str, Object.assign({}, this, opts)); }
function renderMarkdown(str, opts) { return markdownIt.render(str, opts).body; }
function renderFile(filepath, opts) { }
function include() {}

const pugLocals = {

  // will be set by process
  filename: undefined,
  pathname: undefined,
  basedir: undefined,
  pretty: undefined,

  // data functions
  _: require('lodash'),
  lodash: require('lodash'),
  dateFns: require('date-fns'),
  faker: require('faker'),
  chance: new (require('chance'))(),
  node: {
    path: require('path'),
    url: require('url')
  },

  // file functions
  require,
  listFiles,
  getSizeOf,
  renderPug,
  renderMarkdown,
  // renderFile, // not ready
  // include, // not ready

  // filters
  filters: {
    'markdown-it': function (str, options) {
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

module.exports = {
  pugLocals
};
