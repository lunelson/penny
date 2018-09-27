/*
  POSTHTML testing

  config loading
    https://github.com/posthtml/posthtml-load-options
    https://github.com/posthtml/posthtml-load-config

  utlilties (dev and prod) ??
    posthtml-alt-always https://github.com/ismamz/posthtml-alt-always
    posthtml-prevent-widows https://github.com/bashaus/prevent-widows

  minification (prod only)
    posthtml-minifier https://github.com/Rebelmail/posthtml-minifier
      html-minifier https://github.com/kangax/html-minifier
        [uses] clean-css https://github.com/jakubpawlowicz/clean-css
          [also used by] https://github.com/leodido/postcss-clean
        [uses] uglify-js https://github.com/mishoo/UglifyJS2
          [also used by] https://github.com/webpack-contrib/uglifyjs-webpack-plugin

  workflow functions
    collect-styles https://github.com/yakunichevaleksandr/posthtml-collect-styles
      (takes style blocks in body, concats them to head!!)

  CONCLUSIONS:
    - no linting/correction -- in keeping with decision re eslint
    - possibly put collectStyles option in to pennyrc (special workflow)
*/

const posthtml = require('posthtml');
const preventWidows = require('prevent-widows');

const html = `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<body>
    <!-- NOTE custom attributes should still work -->
    <div no-widows @click="doSomething" v-bind:key="value" :key2="value2">
        <title>Super Title</title>
        <text>Awesome Text</text>
        <img src="hello.jpg">
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut lab</p>
        <div>lorem ipsum dolar sit a met</div>
        <div>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt u lab</div>
      </div>
  <style> body {color: blue}</style>
  <style> body {background-color: red}</style>
</body>
</html>`;

const result = posthtml()
  // .use(require('posthtml-doctype')({ doctype : 'HTML 5' }))
  .use(require('posthtml-minifier')({
    removeComments: true,
    collapseWhitespace: true,
    // conservativeCollapse: true,
  }))
  // .use(require('posthtml-alt-always')())
  // .use(preventWidows.posthtml({ attrName: 'no-widows' }))
  .use(require('posthtml-collect-styles')())
  .process(html, { sync: true })
  .html

console.log(result)
