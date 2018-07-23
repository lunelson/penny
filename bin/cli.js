#!/usr/bin/env node

'use-strict';

// NPM
const path = require('path');
const cli = require('commander');

// LOCAL
const {eazyLogger} = require('../lib/loggers.js');
const pkg = require('../package.json');
const { serve, build } = require('../index.js');

var banner = `
       XXXX    XXXX
       XXXX    XXXX
   XXXXXXXXXXXXXXXXXXXX     _ __   ___ _ __  _ __  _   _
 XXXXXXXXXXXXXXXXXXXXXX    | '_ \\ / _ \\ '_ \\| '_ \\| | | |
XXXX                       | |_) |  __/ | | | | | | |_| |
XXXX                       | .__/ \\___|_| |_|_| |_|\\__, |
 XXXXXXXXXXXXXXXXXXXXXX    | |                      __/ |
   XXXXXXXXXXXXXXXXXXXX    |_|                     |___/
       XXXX    XXXX
       XXXX    XXXX`;

var header = `
 Welcome to penny v${pkg.version}
 README: https://github.com/lunelson/penny
`;

function print() {
  eazyLogger.info(`{green: ${banner}}`);
  eazyLogger.info(`{green: ${header}}`);
}

// VERSION
cli.version(pkg.version, '-v, --version');

// SERVE
cli
  .command('serve [src]')
  .description('serve source directory')
  .action((src = '.') => {
    print();
    serve(path.resolve(src));
  });

// BUILD
cli
  .command('build <src> <out>')
  .description('build source directory to output directory')
  .action((src, out) => {
    print();
    build(path.resolve(src), path.resolve(out));
  });

// PARSE
cli.parse(process.argv);
if (cli.args.length < 1) cli._events['command:serve'](); // default command
