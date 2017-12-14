

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
      for each srcExt:
        - init a render function based on srcExt
        - filter-files in baseDir, for srcExt
        - for each file:
          - render from srcPath to outPath

    SERVE
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
