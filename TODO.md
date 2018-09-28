## misc high priority

- skip processing of files which are .min.css or .min.js etc. -- serve/copy directly
- change option reference from 'pubDirName' to just 'webroot'
- add options outlined in RULES
  - baseurl: '' -- add a function to templates that allows resolving baseurl, e.g. publicURL('/path/to/something') ->

## build.js re-write

use sindresorhus step interface
replace rrdir with chokidar watchers
for each src type, set watcher
  addInitial: false
  on 'add', push to array of 'added files'
  process all watched files, then
    process all added files resulting from the processing of initial adds

- add cli-step interface https://github.com/poppinss/cli-step#readme
- use chokidar watcher to gather files for build -> get watchedFiles
  - run all pug and MD files first, then re-retrieve watchedFiles in case any new files have been generated from templates and added in meantime
  - *actually, just use the compiler watchers, to return their watched files, and
  - use a final chokidar instance to pick up anything that *doesn't* match srcFiles and doesn't match junk

## read-data / data-loading support: JSON5 (JSONC), TOML, CSV

consider forking and re-writing read-data package:
  - sync operations only
  - support for TOML, CSV, JSONC, JSON5

1. add loader support to webpack
  - json5 https://webpack.js.org/loaders/json5-loader/
  - cson https://github.com/awnist/cson-loader
  - yaml https://github.com/okonet/yaml-loader
  - toml https://github.com/KyleAMathews/toml-loader
  - md/front-matter https://github.com/atlassian/gray-matter-loader, https://webpack.js.org/loaders/yaml-frontmatter-loader/

2. fork/refactor and replace read-data with expanded function:
  - [various] https://github.com/develar/read-config-file
  - toml https://github.com/BinaryMuse/toml-node#readme
  - json5 https://github.com/json5/json5
  - cson https://github.com/bevry/cson, https://github.com/groupon/cson-parser

## CSS pre-processing, other languages

Stylus -- will integrate just like Sass, pretty much
http://stylus-lang.com/docs/js.html

## HTML templating, other languages

http://ejs.co/
http://olado.github.io/doT/
http://tryhandlebarsjs.com/
http://mustache.github.io/
https://handlebarsjs.com/
https://github.com/bminer/node-blade
https://harttle.land/liquidjs/
https://mozilla.github.io/nunjucks/
https://node-swig.github.io/swig-templates/

## autoprefixer config

- prefer 'browsers' key in .pennyrc, but fall back to package.json

## vue webpack support

- make sure postCSS and Sass are both receiving the same config in webpack as in penny
  https://github.com/postcss/postcss-loader#autoprefixing
  https://github.com/csstools/postcss-preset-env

## compilers, universalize

- add compile-html, with post-html processing; set as super of compile-pug
- make compile-scss inherit from compile-css
- add compile-styl, set to inherit from compile-css too
  - NB: maybe a post-processing method is needed, which is used inside "stream"
- change the logic of the srcWatching and the build/serve routines accordingly

## content generation

- consider adding fixture-factory as _fixtures
  https://fixture-factory.readme.io/docs/getting-started
- consider creating a *new* instance of chance, fixtures and any other lib that allows mixins, for each return of the pugFunctions setup -- so they don't get mutated

## misc TODO

- add configuration hooks like jekyll's global configuration
- loggers: make sure logLevel is being brought through from options

## pug / md testing

- create specific src folder patterns under tests/penny:
  - srcDir-style
  - pubDir-style
  -
  - sass-functions

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

## compilers

- test graphing of dependencies with
  - sass-graph

## pennyrc options

webpackConfig
markdownItOptions
markdownItPlugins
postCSSPlugins
?sassFunctions
?pugFunctions
browserSyncOptions
