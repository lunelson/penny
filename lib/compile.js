const fs = require('fs');
const path = require('path');

const toStream = require('to-readable-stream');
const readFile = require('fs-readfile-promise');

const { pennyLogger } = require('./util-loggers.js');

/**
 * COMPILER
 *
 * checkdep
 * reset
 * stream
 * compile
 * super.compile
 * output
 * render
 * postprocess
 */

/*
  COMPILER
    options
      onCompile
    srcFile
    depFiles
    constructor()
    checkdep()
    reset()

  HTML-COMPILER
    route
    constructor()
      super()
    compile()

  CSS-COMPILER
    constructor()
      super()
    compile()

  SCSS COMPILER
    constructor
      super
    compile
      (do compile)
      super.compile(result)

  sourceCache = compiled fn
  renderCache = rendered string

  render
    renderCache
  output
    outputCache

  source()
    // this would compile, in the case of pug/others
    return fs.readFileSync(this.srcFile, utf8)
  render()
    if (sourceCache in this) return
  output()
    if (outputCache in this) return this.outputCache
    return this.render()
*/

module.exports = class Compiler {
  constructor(srcFile, options) {
    this.options = options;
    this.srcFile = srcFile;
    this.outFile = srcFile;
    this.depFiles = [];
    this.outputCache = '';
  }

  checkDep(depFile) {
    if (!(depFile == this.srcFile || ~this.depFiles.indexOf(depFile)))
      return false;
    pennyLogger.debug(
      `${path.relative(
        this.options.srcDir,
        this.srcFile,
      )} matches or depends upon: ${path.relative(
        this.options.srcDir,
        depFile,
      )}`,
    );
    this.reset();
    return true;
  }

  reset() {
    delete this.outputCache;
  }

  render(src) {
    src = src || fs.readFileSync(this.srcFile, 'utf8');
    this.outputCache = src;
    return this.outputCache;
  }

  output() {
    return this.outputCache || this.render();
  }
};
