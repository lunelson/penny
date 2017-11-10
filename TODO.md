# next

- tweak babel config to also apply polyfills
  https://babeljs.io/docs/plugins/preset-env/
  https://github.com/babel/babel-preset-env/issues/365
  http://2ality.com/2017/02/babel-preset-env.html#usebuiltins-boolean-default-false
  https://leanpub.com/setting-up-es6/read#ch_babel-helpers-standard-library
  https://stackoverflow.com/questions/43282214/is-it-better-to-have-polyfills-as-import-statements-with-babel-preset-env-or-add
  https://jaketrent.com/post/simplify-babel-setup-with-babel-preset-env/


# questions

- how to use debug correctly, to log the change/render/serve information??

- what exactly is the server config of browser-sync, what other middlewares are used and in what order
  - seems to be: [user-middleware], serve-index, serve-static

# further

- configure prettier and eslint to work together
    https://39digits.com/configure-prettier-and-eslint-in-visual-studio-code/

- make a node CLI tool out of this
    https://medium.freecodecamp.org/writing-command-line-applications-in-nodejs-2cf8327eee2
    https://www.sitepoint.com/javascript-command-line-interface-cli-node-js/
    https://www.smashingmagazine.com/2017/03/interactive-command-line-application-node-js/
    https://developer.atlassian.com/blog/2015/11/scripting-with-node/
