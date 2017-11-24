#!/usr/bin/env node

'use-strict';

const path = require('path');
const chalk = require('chalk');
const debug = require('debug');
const cli = require('commander');
const api = require('./index-api');
const pkg = require('./package.json');

/*
  CLI
  options:
    -b, --base: which directory to serve
    -p, --prod: production mode flag (will also check NODE_ENV)
*/

cli
  .version(pkg.version)
  .option('-p, --prod', 'set production mode flag (falls back to NODE_ENV)') // boolean, cause no capture value. default false
  .option('-b, --base [directory]', 'specify directory to serve (defaults to current)', '.')
  .parse(process.argv);

const baseDir = path.resolve(process.cwd(), cli.base);
const isDev = !(cli.prod != undefined || process.env.NODE_ENV == 'production');
// const banner = '\n  /$$$$$$   /$$$$$$  /$$$$$$$  /$$$$$$$  /$$   /$$\n /$$__  $$ /$$__  $$| $$__  $$| $$__  $$| $$  | $$\n| $$  \\ $$| $$$$$$$$| $$  \\ $$| $$  \\ $$| $$  | $$\n| $$  | $$| $$_____/| $$  | $$| $$  | $$| $$  | $$\n| $$$$$$$/|  $$$$$$$| $$  | $$| $$  | $$|  $$$$$$$\n| $$____/  \\_______/|__/  |__/|__/  |__/ \\____  $$\n| $$                                     /$$  | $$\n| $$                                    |  $$$$$$/\n|__/                                     \\______/\n';
const banner = '\n  /¢¢¢¢¢¢   /¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢   /¢¢\n /¢¢__  ¢¢ /¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢  | ¢¢\n| ¢¢  \\ ¢¢| ¢¢¢¢¢¢¢¢| ¢¢  \\ ¢¢| ¢¢  \\ ¢¢| ¢¢  | ¢¢\n| ¢¢  | ¢¢| ¢¢_____/| ¢¢  | ¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢\n| ¢¢¢¢¢¢¢/|  ¢¢¢¢¢¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢|  ¢¢¢¢¢¢¢\n| ¢¢____/  \\_______/|__/  |__/|__/  |__/ \\____  ¢¢\n| ¢¢                                     /¢¢  | ¢¢\n| ¢¢                                    |  ¢¢¢¢¢¢/\n|__/                                     \\______/\n';

console.log(chalk.magenta(banner));
console.log(chalk.blue(`version: ${pkg.version}`));
console.log(chalk.blue(`environment: ${isDev?'development':'production'}`));
console.log(chalk.blue(`running from: ${__dirname}\n`));

api(baseDir, isDev);
