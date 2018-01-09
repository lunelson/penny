//        _   _ _
//       | | (_) |
//  _   _| |_ _| |___ ______ _ __  _   _  __ _
// | | | | __| | / __|______| '_ \| | | |/ _` |
// | |_| | |_| | \__ \      | |_) | |_| | (_| |
//  \__,_|\__|_|_|___/      | .__/ \__,_|\__, |
//                          | |           __/ |
//                          |_|          |___/

/*
  filters API
  - using jstransformer-markdown-it will allow binding a markdown function in to locals as well
  - see these pages for how to hard-bind a markdown filter with markdown-it:
    https://pugjs.org/language/filters.html
    https://github.com/pugjs/pug/blob/master/packages/pug-filters/lib/run-filter.js

*/

/* locals API

filename: [set per file]
pathname: [set per file]
basedir: [set per build/serve]
pretty: [set per environment]
filters: [must be set explicitly] e.g. markdown -> use markdown-it; add config for markdown-it plugins??
globals: false
self: false
debug: false
cache: false
name: false


_
lodash
dateFns
node.path
node.url

require
renderPug
renderMarkdown
renderMD
include

listFiles
getSizeOf

faker
chance

*/

const pugLocals = {
  cache: false,
  globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
  doctype: 'html'
};

module.exports = {
  pugLocals
};
