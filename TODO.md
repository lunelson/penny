## static sites notes

- use the term 'site-generator' not 'static-site-generator'
- rsz.io for responsive images
- lunr.js for searching, is easier and more predictable than algolia
  - wiredcraft made a tokenizer for chinese
- zapier.com for API connection
  - otherwise deploy a micro-service on zeit.co/now
  - or serverless, or write your own backend
- embed tiny webapps with Vue or React
- dotyaml is a new service they are bringing out

## i18n

- keep a /translation subfolder in /data, with YML locale files
- is there a way to use symlinks, to generate nested alternate-language folders?

## penny thoughts

- can we support CSV data files
- can we go back to rendering-on-request
  compiler
    .init
    .check
    .reset
    .stream
- go back to JS rendering on-request ??
-

`## i18n via symlinks

```
_i18n/
  foo/ [link to foo]
  bar/ [link to bar]
  baz/ [link to baz]
foo/
bar/
baz/
de/ [ link to _i18n ]
fr/ [ link to _i18n ]
```

- will chokidar watch these files, and/or
  - do I need to filter and/or pass-on file events ??
- will connect serve these files as they are?
- will my build command build them?

## test routes

test
  build
  serve
    css
    html
    js
    md
      no-layout
      no-publish
    pug
      data
      pages (routes)
      filters
      helpers
      3rdparty
    scss
  scratch


## compiler class

methods
  constructor
  check(absFile)
    if absFile in depFiles, reset
  reset
    pug, ejs, md
      delete this.template, this.outCache
    scss, styl
      delete this.outCache
  stream
    if !(template in this), recompile this srcFile to this.template
    if !(outCache in this), rerender this.template to this.outCache
    return toStream(this.outCache)
props
  template
  outCache
  depFiles

## pug compilation

setupPugOptions() => class PugOptions
setupPugLocals() => class PugLocals

## markdown compilation
- we can assume it has a layout key
- find the layout file... does it use a block, or a yield statement??
- parse the markdown file and pass to the layout
- assume block content

  const { data: $page, content } = grayMatter(mdFile)
  const pugAbsLayout = pugAbsolve(data.layout)
  const pugStr = `
  extends ${pugAbsLayout}
  block content
    != ${markdown(content)}
  `
  this.template = pug.compile(pugStr, options);
  this.outCache = this.template($data, $pages, $page, ...locals);
  return toStream(this.outCache);

## dataWatching/-Syncing

function htmlRefresh
  srcCompilers.forEach
    if htmlCompiler, delete compiler.outCache
  bsyncRefresh(.html)

js|json|yml|yaml|csv, (event, relFile) =>
  if (add||change||unlink)
    dataTreeSync(event, relFile)
    htmlRefresh()

## pageWatching/-Syncing

html|pug|md, (event, relFile) =>
  if (add||change||unlink)
    pageMapSync(event, relFile)
    htmlRefresh()

## srcWatching/-Syncing logic

html|pug|md|css|scss, (event, relFile) =>
  if pug|md|scss
    if not _file or _folder/file
      if unlink, srcCompilers.delete(srcFile)
      else if (add||change) && !srcCompilers.has(srcFile)
        if srcExt == .md
          data = graMatter(srcFile);
          bail, if !(layout in data) -- [it's not a page]
          bail, if (!isDev && data.publish == false) -- [it's a draft]
        srcCompilers.set(srcFile, new SrcCompiler(srcFile));
    if srcCompilersReady
      srcCompilers.forEach => check(absFile)
  bsyncRefresh(outExt)

## srcServing logic

bail, if _file or _folder/file
bail, if fileExt is not in [html, css, js]
if fileExt == .js
  look in bundleCache, look in memoryFs; return stream.pipe(res)
else
  srcFile =
  compiler = srcCompilers.get(srcFile)
  if compiler
    set headers
    return compiler.stream().pipe(res)
  else next()



## pug / md testing

templates (pug + md-via-pug-layout)
  props
    $data, $pages, $page, $options
  lib methods
    _, _dayjs, _moment, _dateFns
    _faker, _chance, _casual
  own methods
    dump
    --
    require
    --
    renderX
    --
    readX
    --
    writeX




## pug/locals

- locals need to also contain options, because they will be used on the render function
- maybe put them in options or _options

data sources
  $data, $pages, $page, $options

data manip / gen
  _, _dayjs, _moment, _dateFns
  _faker, _chance, _casual
  TODO: add casual https://github.com/boo1ean/casual

props & methods
  dump
  $page
    filename
    dirname
    pathname
  $options
    basedir
    filename
    pretty
    doctype.. etc.

bound methods
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


## new libraries

- fs.createReadStream() can accept a Buffer https://stackoverflow.com/a/47092689/1204994
  - but it might not work the way we want https://stackoverflow.com/a/45891702/1204994
  - this seems like the better explanation https://stackoverflow.com/questions/13230487/converting-a-buffer-into-a-readablestream-in-nodejs
    - and this makes it simple https://github.com/sindresorhus/to-readable-stream


https://webpack.js.org/api/compiler-hooks/
https://github.com/pksjce/webpack-internal-examples/blob/master/compiler-example/compiler-example.js
https://webpack.js.org/configuration/watch/#watchoptions-aggregatetimeout


## watchers

DATA
  _data/**/*.(yml|yaml|json)
    - set/unset data at path

PAGES
  **/*.(pug|md|mdown|markdown|html), ignored: [leading underscores]
    - set/unset matter at path

SRC_FILES
  **/*.(pug|md|mdown|markdown|scss|js), ignored: [leading underscores]
    - create/destroy Compiler(ext)

ALL
  **/*
    - filter Compilers, for Compiler.deps.indexOf(file)
      - if result, Compiler.dirty = true

MWARE
  function(req, res, next) {
    // parse out srcFile from req
    return Compilers[srcFile].serve(res, next);
  }

  function srcServer(srcFile, res, next) {
    // stat for srcFile
    // set headers
    return Compilers[srcFile].stream().pipe(res)
  }

## compilers

  class Compiler {
    constructor(file) {},
    dirty: true,
    dependencies: [],
    cached: null,
    stream() {
      if (this.cached && !this.dirty) return this.cached().pipe(res);
      ... compile the file
    }
  }

  class HTMLCompiler extends Compiler {
    constructor(file) {
      super();
    }
  }
  class PugCompiler extends Compiler {
    constructor(file) {
      super();
    }
  }
  class MDCompiler extends Compiler {
    constructor(file) {
      super();
    }
  }
  class SassCompiler extends Compiler {
    constructor(file) {
      super();
    }
  }
  class CSSCompiler extends Compiler {
    constructor(file) {
      super();
    }
  }
  class JSCompiler extends Compiler {
    constructor(file) {
      super();
    }
  }

- use streams
- test graphing of dependencies with
  - sass-graph
  - pug.compile
  - webpack -- either plugin or compilation hook
    https://webpack.js.org/contribute/plugin-patterns/
    https://webpack.js.org/api/compilation-hooks/



## pennyrc options

browsersync
  - use `browserSync` key
  - remove any options you want to protect; merge the rest
  - see this list https://browsersync.io/docs/options
eslintConfig
eslintPlugins
postcssPlugins
webpackPlugins
sassFunctions
pugFunctions

## CLI prompting / step-through

Prompts https://github.com/terkelg/prompts
Prompt https://github.com/flatiron/prompt
Enquirer https://github.com/enquirer
Inquirer https://github.com/SBoudrias/Inquirer.js

## debug and colored output, documentation

https://github.com/visionmedia/debug
https://www.npmjs.com/package/supports-color
https://github.com/chalk/chalk


## terminal recorders

https://github.com/icholy/ttygif
https://github.com/chjj/ttystudio
https://asciinema.org/

## CLI spinners / task-feedback

https://github.com/sindresorhus/ora
https://github.com/SamVerschueren/listr


## node_modules resolution: find up

https://www.npmjs.com/package/find-node-modules
https://www.npmjs.com/package/findup-sync
https://www.npmjs.com/package/find-up
https://www.npmjs.com/package/read-pkg-up
https://www.npmjs.com/package/pkg-up
https://www.npmjs.com/package/pkg-dir
https://www.npmjs.com/package/resolve-up


## NEW NOTES on render API

- !! each render function should know whether it is being called in 'serve' or 'build' mode (or maybe it's development/production) ??
  - serve mode error: return formatted error from .catch() clause
  - build mode error: throw plaintext error from .catch() clause
  - ... so that build-xxx function can have its own .catch() clause, where it handles the error...


## random

- add fg/bg coloring to the errors.js functions
- proof eslint processing:
  - how other configs get merged against baseConfig?
  - does the use useEslintrc rule need to be set to false?

## js root importing

  - babel solution A
  https://github.com/entwicklerstube/babel-plugin-root-import

  - babel solution B
  https://github.com/tleunen/babel-plugin-module-resolver
  https://github.com/benmosher/eslint-plugin-import
  https://github.com/tleunen/eslint-import-resolver-babel-module

  - webpack solution ??
  https://moduscreate.com/blog/es6-es2015-import-no-relative-path-webpack/


## linting/rendering

- add coloring to error CSS rules
- check the effects of the `useEslintrc` option
- find the eslint:recommended baseConfiguration; copy/extend that? and/or add the following rules

```js
  'no-div-regex': ['error'],
  'no-eq-null': ['error'],
  'no-redeclare': ['error'],
  'no-octal': ['error'],
  'no-proto': ['error'],
  'no-self-assign': ['error'],
  'no-self-compare': ['error'],
  'no-sequences': ['error'],
  'no-throw-literal': ['error'],
  'no-unmodified-loop-condition': ['error'],
  'wrap-iife': ['error'],
  'no-undef': ['error'],
  'no-delete-var': ['error']
```


## CLI -> serve vs build

## src-/reqFile priority

remove the check for reqFile, let srcFile have priority

in serve.js
  abstract this process to an agnostic generic serve function
  **renderCache, renderTimes will be universal for all serving

in build.js
  rough in the corresponding agnostic generic build function, that passes to render functions

## render functions

accept
  baseDir, isDev, options
  return fn(srcFile, renderTimes)

notes
  must create promise
  must catch internally, in order to update renderTimes either way
  **must ultimately return or throw, so it can be then/catch'd back in serve/build function

return
  promise
    .then => res.end(data)
    .catch => res.end(err)

## TESTS

    test
      fail
        js
        pug
        scss
      util
        pug
          props.pug
          file-fns.pug
          data-fns.pug
        scss
        js







eliminate loggers.js; loggerFn will be created on the fly in the srcWare function


  CLI
    - gather all command-line options; pass them to API.serve or API.build
    - no more -p option; build is always dev false, linting true; otherwise pick up NODE_ENV for serve command

  API
    - collect any rcOptions as rcPromises
    - import /src/build and /src/serve as doBuild and doServe
    - export build/serve functions, which in turn
      - execute doBuild/doServe with combined options, when rcPromises are all resolved

  SRC

    BUILD
      - should ignore folder or file names with leading _underscore, so as to hide certain elements from build
      - linting default is true, isDev is false unless NODE_ENV = 'development'
      for each srcExt:
        - init a render function based on srcExt
        - filter-files in baseDir, for srcExt
        - for each file:
          - render from srcPath to outPath

    SERVE
      - will not ignore leading _underscore file/folder names
      - linting default is false, isDev is true unless NODE_ENV = 'production'
      - consider removing fs.stat check for reqFile, before srcFile; this would unify the process and prioritise srcFiles
      - for production serve, figure out if port is in use and use next available
      - when responding, check renderCache[srcFile].then((obj) =>{...})
          if (obj.fail) res.send(srcErr(obj.data));
          res.send(obj.data)

    ERROR
      - export error functions by type: css, html, js
      - will be imported by renderers and created on the fly with srcExt and color

    RENDER-{src}
      - render a promise, that returns an object
          fail: 'sass'|'pug'|'rollup'|'stylelint'|'eslint'|false
          data: data|err
      - render a promise that returns either the success css/js/html or the respective error

      RENDER-js
        - add `import 'babel-polyfill';` and eventually `'use-nodent'` in header
