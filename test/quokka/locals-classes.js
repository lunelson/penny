const fs = require('fs');
const { resolve, dirname, join } = require('path');

const Pug = require('pug');
// const requireResolve = require('resolve'); // for implementing require in put
// const grayMatter = require('gray-matter');
// const UrlPattern = require('url-pattern');
// const write = require('write');
// const readData = require('config-data');
// const imageSize = require('image-size');
// const _ = require('lodash');
// const _dayjs = require('dayjs');
// const _moment = require('moment');
// const _dateFns = require('date-fns');
// const _faker = require('faker');
// const _chance = new (require('chance'))();
// const _casual = require('casual');
// const _case = require('change-case');

Pug.render('h1 hello world'); //?
Pug.render('h1= foo', { foo: "bar string" }); //?
Pug.render('h1= foo()', { foo() { return this.baz }, baz: 'huh' }); //?

class TestLocals {
  // foo = () => this.baz;
  constructor(baz) {
    this.baz = baz;
    this.foo = (() => this.baz)
  }
}
Pug.render('h1= foo()', new TestLocals('bizzy')); //?

class Locals {
  constructor(compiler = {}) {
    this.$compiler = compiler;
  }
}
Object.assign(Locals.prototype, {
  // data gen
  _faker,
  _chance,
  _casual,

  // dates
  _dayjs,
  _moment,
  _dateFns,
  // utils
  _,
  _case,
  // node
  __fs: require('fs'),
  __path: require('path'),
});

class PugLocals extends Locals {

  include(relFile) {
    const absFile = srcResolve(relFile);
    try {
      const template = Pug.compileFile(absFile, this.compiler.pugOptions);
      this.compiler.depFiles.push(absFile, ...template.dependencies);
      return '\n' + template(this).trim();
    } catch (err) {
      throw Error(err);
    }
  }

  render(str) {
    try {
      const template = Pug.compile(str, this.compiler.pugOptions);
      this.compiler.depFiles.push(...template.dependencies);
      return '\n' + template(this).trim();
    } catch (err) {
      throw Error(err);
    }
  }

  renderFile(relFile) {
    const absFile = srcResolve(relFile);
    try {
      const template = Pug.compileFile(absFile, this.compiler.pugOptions);
      this.compiler.depFiles.push(absFile, ...template.dependencies);
      return '\n' + template(this).trim();
    } catch (err) {
      throw Error(err);
    }
  }
}

class NjkLocals extends Locals {
  constructor() {
    super();
  }
}

const locals = new PugLocals();

locals._chance.sentence(); //?
locals._casual.sentence; //?
