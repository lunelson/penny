const fs = require('fs');
const path = require('path');

const stylus = require('stylus');
const { nodes, utils } = stylus;

const srcFile = '/foo/bar/src/source.styl';
const outFile = '/foo/bar/out/output.css';
const srcDir = '/foo/bar/src';

path.relative(outFile, srcDir); //?
path.resolve(path.dirname(srcFile), '../baz'); //?
path.resolve(path.dirname(srcFile), './baz'); //?
path.resolve(path.dirname(srcFile), '/baz'); //?

// console.log(nodes);
/**
 * STYLUS
 *
 * http://stylus-lang.com/docs/js.html
 * https://github.com/stylus/stylus
 *
 * options
 *   filename -- srcFile
 *   paths -- additional resolution paths
 *   nocheck -- don't check file existence
 *   use -- fn or array of fns to invoke w renderer, to attach options
 *
 */

const functions = {

  add(a, b) {
    return a.operate('+', b);
  },

  sub(a, b) {
    return a.operate('-', b);
  },

  'read-data'(relFile) {
    const absFile = absolve(relFile.getValue());
    depFiles.push(absFile);
    return sassUtils.toSass(readData.sync(absFile));
  },

  // numeric
  sign(x) { return new nodes.Unit(Math.sign(x)); },
  trunc(x) { return new nodes.Unit(Math.trunc(x)); },
  pow(x, y) { return new nodes.Unit(Math.pow(x, y)); },
  sqrt(x) { return new nodes.Unit(Math.sqrt(x)); },
  cbrt(x) { return new nodes.Unit(Math.cbrt(x)); },
  exp(x) { return new nodes.Unit(Math.exp(x)); },
  expm1(x) { return new nodes.Unit(Math.expm1(x)); },
  log(x) { return new nodes.Unit(Math.log(x)); },
  log1p(x) { return new nodes.Unit(Math.log1p(x)); },
  log10(x) { return new nodes.Unit(Math.log10(x)); },
  log2(x) { return new nodes.Unit(Math.log2(x)); },
  hypot(x, y) { return new nodes.Unit(Math.hypot(x, y)); },
  // trigonometric
  deg2rad(deg) { return new nodes.Unit(deg * Math.PI / 180) },
  rad2deg(rad) { return new nodes.Unit(rad * 180 / Math.PI) },
  // NB: sin, cos and tan already exist in Stylus
  acos(x) { return new nodes.Unit(Math.acos(x)); },
  asin(x) { return new nodes.Unit(Math.asin(x)); },
  atan(x) { return new nodes.Unit(Math.atan(x)); },
  atan2(y, x) { return new nodes.Unit(Math.atan2(y, x)); },
  // acosh(x) { return new nodes.Unit(Math.acosh(x)); },
  // asinh(x) { return new nodes.Unit(Math.asinh(x)); },
  // atanh(x) { return new nodes.Unit(Math.atanh(x)); },
  // cosh(x) { return new nodes.Unit(Math.cosh(x)); },
}

console.log('hypot', Math.hypot(3, 4));

const str = `
ul
  li a
    display: block
    color: blue
    padding: 5px
    html.ie &
      padding: 6px
    &:hover
      color: red
.tests
  out add(1,2)
  out sub(1,2)
  out pow(2,2)
  out hypot(3,4)
  out deg2rad(180)
  out rad2deg(3.141592653589793)
`;

const stylConfig = stylus => {
  stylus.set('filename', __filename) // srcFile
  stylus.set('nocheck', true) // we know the file exists
  stylus.set('paths', []) // node_modules, srcDir
  stylus.set('sourcemap', {
    // comment: true,
    // inline: true,
    // basePath: __dirname,
    // comment
    //   Adds a comment with the`sourceMappingURL` to the generated CSS(default: `true`)
    // inline
    //   Inlines the sourcemap with full source text in base64 format(default: `false`)
    // sourceRoot
    //   "sourceRoot" property of the generated sourcemap
    // basePath
    //   Base path from which sourcemap and all sources are relative(default: `.`)
  })
  Object.keys(functions).forEach(name => {
    stylus.define(name, functions[name]);
  })
}

// COMPILE
const template = stylus(str)
  .use(stylConfig);

// GET DEPS
template.deps(); //?

// RENDER
const css = template.render();
console.log('css is: ', css)
//   // RENDER
// template.render(function(err, css) {
//     if (err) throw err;
//     console.log(css);
//   })
