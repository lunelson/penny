# random, based on packages

* serve a hard-coded 'penguin' favicon to all views
* allow pick up of a .penguinrc file:
  - src/out file-mapping
  - browserslist
  - data.json/.js file, to be passed to json-server-like core
  - arbitrary locals for PUG
* integrate eslint warnings in JS serve; stylelint warnings in CSS serve:
  - minimal config only for bug-catching; or
  - allow pickup of config files, in served directory
* serve all files with full compression in production mode

# next

* use bsync notify? or return the error in the response?
  - for CSS, as override CSS
  - for JS, as JS-appended override CSS
  - for HTML, as blank doc with override CSS in head
  - check out the current error handling in the SCSS render...
    does it work? If so, this could be extended to the others

* add utils to sass and pug:
    basedir, filename, pathname
    // node = { fs, path, url, require } ?
    // assetURL(figures out dest wrt src) ?
    dirlist(dirPath, fileRegex)
      fs.readdirSync
      https://github.com/jonschlinkert/filter-files
    sizeof(filePath)
      https://www.npmjs.com/package/image-size
    markdown
    markdownFile
    markdownInline
    render(pugString)
    include(pugFile) // load file to string then render as if inline

* tweak babel config to also apply polyfills and support stage-3
  https://babeljs.io/docs/plugins/preset-env/
  https://github.com/babel/babel-preset-env/issues/365
  http://2ality.com/2017/02/babel-preset-env.html#usebuiltins-boolean-default-false
  https://leanpub.com/setting-up-es6/read#ch_babel-helpers-standard-library
  https://stackoverflow.com/questions/43282214/is-it-better-to-have-polyfills-as-import-statements-with-babel-preset-env-or-add
  https://jaketrent.com/post/simplify-babel-setup-with-babel-preset-env/


# questions

* how to use debug correctly, to log the change/render/serve information??

* what exactly is the server config of browser-sync, what other middlewares are used and in what order
  - seems to be: [user-middleware], serve-index, serve-static

# further

* configure prettier and eslint to work together
    https://39digits.com/configure-prettier-and-eslint-in-visual-studio-code/

* make a node CLI tool out of this
    https://medium.freecodecamp.org/writing-command-line-applications-in-nodejs-2cf8327eee2
    https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
    https://www.smashingmagazine.com/2017/03/interactive-command-line-application-node-js/
    https://developer.atlassian.com/blog/2015/11/scripting-with-node/
