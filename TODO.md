## root-mode and build !!

- pass srcDir and baseDir to srcWatch and jsWatch; pass these all the way down
- add the sindresorhus 'step' interface thingy for the build step
- add keep-files option to pennyrc; pass through and transform to keepFilesGlob

## content generation

- consider adding fixture-factory as _fixtures
  https://fixture-factory.readme.io/docs/getting-started
- consider creating a *new* instance of chance, fixtures and any other lib that allows mixins, for each return of the pugFunctions setup -- so they don't get mutated

## misc TODO

- add configuration hooks like jekyll's global configuration
- loggers: make sure logLevel is being brought through from options

## markdown compilation
- would a yield statement have been better?

## bsyncRefresh
- can this be debounced more smartly, to collect the arguments passed (outExts) and then fire once with all the collected args?

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
