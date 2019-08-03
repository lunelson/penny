const path = require('path');
const _ = require('lodash');

const nodeSass = require('node-sass');
const dartSass = require('dart-sass');
const configSassUtils = require('node-sass-utils');

const readData = require('./../../lib/config-data');

const srcFile = '/foo/bar/src/source.styl';
const outFile = '/foo/bar/out/output.css';
const srcDir = '/foo/bar/src';

path.relative(outFile, srcDir); //?
path.resolve(path.dirname(srcFile), '../baz'); //?
path.resolve(path.dirname(srcFile), './baz'); //?
path.resolve(path.dirname(srcFile), '/baz'); //?

const useDartSass = false;

const sassEngine = useDartSass ? dartSass : nodeSass;

const sassUtils = configSassUtils(sassEngine);

sassUtils.toSass = function(jsValue = {}) {
  if (jsValue && !(typeof jsValue.toSass === 'function')) {

    jsValue = _.isString(jsValue) ?
      sassUtils.infer(jsValue) :
      _.isArray(jsValue) ?
        _.map(jsValue, val => sassUtils.toSass(val)) :
        _.isObject(jsValue) ?
          _.mapValues(jsValue, val => sassUtils.toSass(val)) :
          jsValue;
  }
  return sassUtils.castToSass(jsValue);
};

sassUtils.infer = function(jsValue) {
  let result;
  try {
    sass.renderSync({
      data: `$_: infer(${jsValue});`,
      functions: { 'infer($value)': value => { result = value; return value; } }
    });
  } catch (e) { return jsValue; }
  return result;
};

/* testFileJSON: #{read-data('./test-sass-data.json')} */
const src = `
$test-data: test-data();
.test-data {
  string: inspect(map-get($test-data, 'string'));
  number: inspect(map-get($test-data, 'number'));
  color1: inspect(map-get($test-data, 'color1'));
  color2: inspect(map-get($test-data, 'color2'));
  color3: inspect(map-get($test-data, 'color3'));
  color4: inspect(map-get($test-data, 'color4'));
  list: inspect(map-get($test-data, 'list'));
  map: inspect(map-get($test-data, 'map'));
  unit_number: inspect(map-get($test-data, 'unit_number'));
  typeof-string: type-of(map-get($test-data, 'string'));
  typeof-number: type-of(map-get($test-data, 'number'));
  typeof-list: type-of(map-get($test-data, 'list'));
  typeof-map: type-of(map-get($test-data, 'map'));
  typeof-unit_number: type-of(map-get($test-data, 'unit_number'));
}
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li { display: inline-block; }

  a {
    display: block;
    padding: 6px 12px;
    text-decoration: none;
  }
  display: grid;
  transition: all .5s;
  user-select: none;
  background: linear-gradient(to bottom, red, black);
}
`;

// // sassEngine;
// new sassEngine.types.String('hello'); //?
// true ? sassEngine.types.Boolean.TRUE : sassEngine.types.Boolean.FALSE; //?
// sassEngine.types.Null.NULL; //?
// new sassEngine.types.Number(2); //?
// new sassEngine.types.List(5); //?
// new sassEngine.types.Map(4); //?

// // dartSass;
// new dartSass.types.String('hello'); //?
// true ? dartSass.types.Boolean.TRUE : dartSass.types.Boolean.FALSE; //?
// dartSass.types.Null.NULL; //?
// new dartSass.types.Number(2); //?
// new dartSass.types.List(5); //?
// new dartSass.types.Map(4); //?

// // nodeSass;
// nodeSass.types.String('hello'); //?
// sassEngine.types.Boolean(true); //?
// nodeSass.types.Null.NULL; //?
// nodeSass.types.Number(2); //?
// nodeSass.types.List(5); //?
// nodeSass.types.Map(4); //?

const parseUnit = require('parse-unit');
const colorString = require('color-string');

function js2sass(jsValue) {
  if (typeof jsValue === "string") {
    const uNumber = parseUnit(jsValue);
    if (!isNaN(uNumber[0])) return new sassEngine.types.Number(...uNumber);
    const rgbColor = colorString.get.rgb(jsValue);
    if (rgbColor != null) return new sassEngine.types.Color(...rgbColor)
    return new sassEngine.types.String(jsValue);
  } else if (typeof jsValue === "boolean") {
    return jsValue ? sassEngine.types.Boolean.TRUE : sassEngine.types.Boolean.FALSE;
  } else if (typeof jsValue === "undefined" || jsValue === null) {
    return sassEngine.types.Null.NULL;
  } else if (typeof jsValue === "number") {
    return new sassEngine.types.Number(jsValue);
  } else if (jsValue && jsValue.constructor.name === "Array") {
    var list = new sassEngine.types.List(jsValue.length);
    for (var i = 0; i < jsValue.length; i++) { list.setValue(i, js2sass(jsValue[i])); }
    var isComma = typeof jsValue.separator === "undefined" ? true : jsValue.separator;
    list.setSeparator(isComma);
    return list;
  } else if (typeof jsValue === "object") {
    var keys = [];
    for (var k in jsValue) {
      if (jsValue.hasOwnProperty(k)) {
        keys[keys.length] = k;
      }
    }
    var map = new sassEngine.types.Map(keys.length);
    for (var m = 0; m < keys.length; m++) {
      var key = keys[m];
      map.setKey(m, new sassEngine.types.String(key));
      map.setValue(m, js2sass(jsValue[key]));
    }
    return map;
  } else {
    throw new Error("Don't know how to coerce: " + jsValue.toString());
  }
}

function absolve(relPath) {
  return relPath[0] === '/'
    ? path.join(__dirname, relPath)
    : path.resolve(__dirname, relPath);
}

const depFiles = [];

const { css, map, stats } = sassEngine.renderSync({
  data: src,
  file: __filename,
  sourceMap: true,
  sourceMapContents: true,
  sourceMapEmbed: true,
  sourceMapRoot: path.relative(outFile, srcDir),
  functions: {
    'test-data()'() {
      return js2sass({
        string: 'hello world',
        number: 123,
        color1: '#bada55',
        color2: 'lightblue',
        color3: '#FFFFFFAA',
        color4: '#bada55',
        list: [1, 2, 3],
        map: { a: 1, b: 2, c: 3 },
        unit_number: '123rem',
      });
    },
    'read-data($relFile)'(relFile) {
      const absFile = absolve(relFile.getValue());
      depFiles.push(absFile);
      return js2sass(readData.sync(absFile));
    },
  }
});

css.toString(); //?
map; //?
stats; //?
