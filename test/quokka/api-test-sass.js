const fs = require('fs');
const path = require('path');

// const nodeSass = require('node-sass');
const dartSass = require('dart-sass');

const srcFile = '/foo/bar/src/source.styl';
const outFile = '/foo/bar/out/output.css';
const srcDir = '/foo/bar/src';

path.relative(outFile, srcDir); //?
path.resolve(path.dirname(srcFile), '../baz'); //?
path.resolve(path.dirname(srcFile), './baz'); //?
path.resolve(path.dirname(srcFile), '/baz'); //?

const useDartSass = true;
const sassEngine = useDartSass ? dartSass : nodeSass;

const src = `
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

const { css, map, stats } = sassEngine.renderSync({
  data: src,
  file: __filename,
  sourceMap: true,
  sourceMapContents: true,
  sourceMapEmbed: true,
  sourceMapRoot: path.relative(outFile, srcDir),
});

css.toString(); //?
map; //?
stats; //?
