#!/usr/bin/env node

'use-strict';

// npm
const path = require('path');
const chalk = require('chalk');
const cli = require('commander');

// local
const pkg = require('../package.json');

cli
.version(pkg.version);
cli
.command('serve [src]', 'serve source directory', {isDefault: true});
cli
.command('build <src> <dist>', 'build source directory to destination');
cli
  .parse(process.argv);

// const baseDir = path.resolve(process.cwd(), cli.src);
// const isDev = !(process.env.NODE_ENV == 'production');
const banner = '\n  /¢¢¢¢¢¢   /¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢   /¢¢\n /¢¢__  ¢¢ /¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢  | ¢¢\n| ¢¢  \\ ¢¢| ¢¢¢¢¢¢¢¢| ¢¢  \\ ¢¢| ¢¢  \\ ¢¢| ¢¢  | ¢¢\n| ¢¢  | ¢¢| ¢¢_____/| ¢¢  | ¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢\n| ¢¢¢¢¢¢¢/|  ¢¢¢¢¢¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢|  ¢¢¢¢¢¢¢\n| ¢¢____/  \\_______/|__/  |__/|__/  |__/ \\____  ¢¢\n| ¢¢                                     /¢¢  | ¢¢\n| ¢¢                                    |  ¢¢¢¢¢¢/\n|__/                                     \\______/\n';
console.log(chalk.magenta(banner));

// console.log();

// console.log(chalk.blue(`version: ${pkg.version}`));
// console.log(chalk.blue(`environment: ${isDev?'development':'production'}\n`));

// api(baseDir, isDev);
