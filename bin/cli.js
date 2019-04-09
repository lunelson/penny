#!/usr/bin/env node

'use-strict';

const path = require('path');

const cli = require('commander');
const up = require('update-notifier');

const { logger } = require('../lib/util-loggers.js');
const { serve, build } = require('../index.js');
const pkg = require('../package.json');

up({ pkg }).notify();

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
  logger.info(`{magenta: ${banner}}`);
  logger.info(`{magenta: ${header}}`);
}

// version
cli.version(pkg.version, '-v, --version');

// serve
cli
  .command('serve [src]')
  .description('serve source directory')
  .action((src = '.') => {
    print();
    serve(path.resolve(src));
  });

// build
cli
  .command('build <src> <out>')
  .description('build source directory to output directory')
  .action((src, out) => {
    print();
    build(path.resolve(src), path.resolve(out));
  });

// parse
cli.parse(process.argv);
if (cli.args.length < 1) cli._events['command:serve'](); // default command
