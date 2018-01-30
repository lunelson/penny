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
