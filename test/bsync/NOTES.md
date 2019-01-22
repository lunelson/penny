files: string, array of strings, array of objects with `match` and `fn`
watch: if true, will add served files to 'files'
  -

ignore: files which should not trigger reload/inject; should be same as `watchOptions.ignored` value
  - does it handle minimatch globs?
  - does it take arrays as well as strings?

single: if true, will include `connect-history-api-fallback` middleware to serve all routes from index.html

server:
  [true] -- will serve cwd
  [string] || [object].baseDir [string] -- will serve dir indicated by string
  [array] || [object].baseDir [array] -- will serve multiple dirs

watchOptions: options for chokidar, on core watcher
watchEvents: array of strings; which events to respond to



## http2

using http2.js: https://www.npmjs.com/package/http2.js

```js
//
// WATCH
//

// old: files matches server.baseDir
{
  "server": {"baseDir": ["app"]}, // NB baseDir can be an array of paths
  "files": ["app"]
}

// new: watch option can simply be true
{
  "server": {"baseDir": ["app"]},
  "watch": "true",
  "ignore": "**/*.js"
}

//
// HTTP2
//

browserSync.init({
    files: ["app/css/*.css"],
    server: {
        baseDir: "app"
    },
    https: true,
    httpModule: "http2.js"
});
```

## http2 with connect

```js
// https://github.com/BrowserSync/browser-sync/issues/766#issuecomment-233866296

var connect = require('connect');
var app = connect();
var fs = require('fs');
var serveStatic = require('serve-static');
require('events').EventEmitter.prototype._maxListeners = 1000000;

app.use('/', serveStatic(__dirname + '/'));

var options = {
    key: fs.readFileSync('./gulp/localhost.key'),
    cert: fs.readFileSync('./gulp/localhost.crt')
};

require('http2').createServer(options, app).listen(8001);
```

## bsync default ignores

```js
const defaultIgnorePatterns = [
    /node_modules/,
    /bower_components/,
    '.sass-cache',
    '.vscode',
    '.git',
    '.idea',
];
```
