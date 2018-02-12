#!/usr/bin/env node

'use-strict';

// npm
const path = require('path');
const chalk = require('chalk');
const cli = require('commander');
const readPkgUp = require('read-pkg-up');

const { pkg } = readPkgUp.sync({ cwd: __dirname });
const isDev = !(process.env.NODE_ENV == 'production');
const banner = '\n  /¢¢¢¢¢¢   /¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢   /¢¢\n /¢¢__  ¢¢ /¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢  | ¢¢\n| ¢¢  \\ ¢¢| ¢¢¢¢¢¢¢¢| ¢¢  \\ ¢¢| ¢¢  \\ ¢¢| ¢¢  | ¢¢\n| ¢¢  | ¢¢| ¢¢_____/| ¢¢  | ¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢\n| ¢¢¢¢¢¢¢/|  ¢¢¢¢¢¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢|  ¢¢¢¢¢¢¢\n| ¢¢____/  \\_______/|__/  |__/|__/  |__/ \\____  ¢¢\n| ¢¢                                     /¢¢  | ¢¢\n| ¢¢                                    |  ¢¢¢¢¢¢/\n|__/                                     \\______/\n';

function loginfo() {
  console.log(chalk.magenta(banner));
  console.log(chalk.blue(`version: ${pkg.version}`));
  console.log(chalk.blue(`environment: ${isDev?'development':'production'}\n`));
}

// VERSION
cli.version(pkg.version, '-v, --version');

// SERVE
cli
  .command('serve [src]')
  .description('serve source directory')
  .action((src = '.', options) => {
    const baseDir = path.resolve(src);
    loginfo();

    // console.log(`
    //   serving from
    //   ${path.resolve(src)}
    // `);
  });

// BUILD
cli
  .command('build <src> <dest>')
  .description('build source directory to destination')
  .action((src, dest, options) => {
    const baseDir = path.resolve(src);
    loginfo();

    // console.log(`
    //   building from
    //   ${path.resolve(src)}
    //   to
    //   ${path.resolve(dest)}
    // `);
  });

// PARSE
cli.parse(process.argv);
if (cli.args.length < 1) cli._events['command:serve'](); // default command
