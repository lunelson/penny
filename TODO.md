# questions

- how to pass browserslist options directly via API to autoprefixer and babel-env
```js
  const browsersList = ["last 2 versions", "safari 7"];
  var prefixer  = postcss([ autoprefixer({ browsers: browsersList }) ]);
  var babelrc = {
    "presets": [
      ["@babel/env", {
        "targets": {
          "chrome": 52,
          "browsers": browsersList
        }
      }]
    ]
  }
```
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
