## Sass Data

- option: `sassData: true|false`
- use SassUtils to turn `$data` in to a Sass file containing a variable `$data` as a map.
- prepend this to Sass renders?; however it requires having $data changes refresh all Sass files, regardless of whether any of them use any data
- better option
  - add `data($path)` function that will read in the file at that path in the `_data` folder
  - that single file gets added to that Sass entry point's dep list


## JS ERRORS!!!

- since webpack js compilation is detached from main build functions, errors in js are only output to console, not piped through penny. this must be fixed

## more complex talking to bsync

see if you can debug the `.sockets` part of the API to reload only relevant connections...
https://github.com/BrowserSync/browser-sync/issues/935

## new config architecture ? seems complicated

serve
  serveParams (deferral)
  pennyServe
    -> resolve the params
build
  buildParams (deferral)
  pennyBuild
    -> resolve the params

## config files, fallback order ?

- browserslist config (autoprefixer, babel)
  - browserslist key in penny config || allow tool to find it
  - browserslist key in package
  - browserlist file
  - .browserslistrc file
- penny config
  - penny key in package
  - .pennyrc file
  - penny.config.js file -- which is recommended for more advanced options
- postcss
  - postcss.config.js ?
- posthtml
  - postthml.config.js ?
- webpack
  - webpack.config.js (will ignore entry and output keys however) ?

## implement the baseUrl option

  - supply pug `baseUrl()` and sass `base-url()` functions, to resolve root urls correctly
  - configure serve according to these posts, when baseUrl option is supplied
    https://github.com/BrowserSync/browser-sync/issues/1224#issuecomment-270751008
    https://stackoverflow.com/questions/30370753/gulp-browsersync-serve-at-path/41494102#41494102
    https://gist.github.com/joemaller/0254b34b88cfc6a9a665025c722891b5
  - NB original logic of the jekyll feature is explained here https://byparker.com/blog/2014/clearing-up-confusion-around-baseurl/

## misc high priority

- add a function to templates for resolving urls in terms of baseUrl option e.g. `publicURL('/path/to/something') ->`
- connect postcss to the new postcss configure options (not yet establishing the CssCompiler class)
- loggers: make sure logLevel is being brought through from options

## build.js re-write

- see pkgs: tiny-glob, eliminate, prompts

- figure out what to do in build.js WRT .min.css or .min.js etc....
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
