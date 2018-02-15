#!/usr/bin/env node

'use-strict';

// npm
const path = require('path');
const chalk = require('chalk');
const cli = require('commander');
const readPkgUp = require('read-pkg-up');

const { pkg } = readPkgUp.sync({ cwd: __dirname });
// const banner = '\n             XXXXXXXX       XXXXXXXX\n             X      X       X      X\n             X      X       X      X\n      XXXXXXXX      XXXXXXXXX      XXXXXXXX\n  XXXX                                    X\n XX                                       X\nXX      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\nX     XX\nX     X\nX     XX\nXX      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n XX                                       X\n  XXXX                                    X\n      XXXXXXXX      XXXXXXXXX      XXXXXXXX\n             X      X       X      X\n             X      X       X      X\n             XXXXXXXX       XXXXXXXX\n                              \n         _ __   ___ _ __  _ __  _   _ \n         | \'_ \\ \/ _ \\ \'_ \\| \'_ \\| | | |\n         | |_) |  __\/ | | | | | | |_| |\n         | .__\/ \\___|_| |_|_| |_|\\__, |\n         | |                      __\/ |\n         |_|                     |___\/ \n';
// const banner = '\n             XXXXXXXX       XXXXXXXX\n             X      X       X      X\n             X      X       X      X\n      XXXXXXXX      XXXXXXXXX      XXXXXXXX\n  XXXX                                    X\n XX                                       X\nXX      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\nX     XX\nX     X\nX     XX\nXX      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n XX                                       X\n  XXXX                                    X\n      XXXXXXXX      XXXXXXXXX      XXXXXXXX\n             X      X       X      X\n             X      X       X      X\n             XXXXXXXX       XXXXXXXX\n';
const banner = '\n              XXXXXXXX       XXXXXXXX\n              X      X       X      X\n              X      X       X      X\n       XXXXXXXX      XXXXXXXXX      XXXXXXXX\n   XXXX                                    X\n XX                                        X\nXX       XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\nX      XX\nX      X\nX      XX\nXX       XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n XX                                        X\n   XXXX                                    X\n       XXXXXXXX      XXXXXXXXX      XXXXXXXX\n              X      X       X      X\n              X      X       X      X\n              XXXXXXXX       XXXXXXXX\n';

function print() {
  console.log(chalk.magenta(banner));
  console.log(chalk.blue(`version: ${pkg.version}`));
  // console.log(chalk.blue(`environment: ${isDev?'development':'production'}\n`));
}

const { serve, build } = require('../index');

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
