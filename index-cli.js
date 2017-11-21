#!/usr/bin/env node

'use-strict';

//                               _                 _ _
//                              (_)               | (_)
//  _ __   ___ _ __   __ _ _   _ _ _ __ ______ ___| |_
// | '_ \ / _ \ '_ \ / _` | | | | | '_ \______/ __| | |
// | |_) |  __/ | | | (_| | |_| | | | | |    | (__| | |
// | .__/ \___|_| |_|\__, |\__,_|_|_| |_|     \___|_|_|
// | |                __/ |
// |_|               |___/

const path = require('path');
const chalk = require('chalk');
const debug = require('debug');
const cli = require('commander');

const api = require('./index-api');
const pkg = require('./package.json');

// TESTING ONLY
// debug.enable('penny:*');

/*
  COMMANDER
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

// const banner = '\n;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n;     _ __   ___ _ __  _ __  _   _     ;\n;    | \'_ \\ \/ _ \\ \'_ \\| \'_ \\| | | |    ;\n;    | |_) |  __\/ | | | | | | |_| |    ;\n;    | .__\/ \\___|_| |_|_| |_|\\__, |    ;\n;    | |                      __\/ |    ;\n;    |_|                     |___\/     ;\n;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n';
// const banner = '\n;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n;                                      ;\n;    ___  __ _ _   _  __ _ _ __ ___    ;\n;   / __|/ _` | | | |/ _` | \'__/ _ \\   ;\n;   \\__ \\ (_| | |_| | (_| | | |  __/   ;\n;   |___/\\__, |\\__,_|\\__,_|_|  \\___|   ;\n;           | |                        ;\n;           |_|                        ;\n;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n';
// const banner = '\n    XXXXXXXXXX\n  XXXX      XXXX\n XX   XXXXXX   XX\nXX  XX      XX  XX     _ __   ___ _ __  _ __  _   _\nXX  XX      XX  XX    | \'_ \\ / _ \\ \'_ \\| \'_ \\| | | |\nXX              XX    | |_) |  __/ | | | | | | |_| |\nXXX            XXX    | .__/ \\___|_| |_|_| |_|\\__, |\nXX XXX      XXX XX    | |                      __/ |\nXX  XXXXXXXXXX  XX    |_|                     |___/\n XX  XX    XX  XX\n  XXXXX    XXXXX\n     XXXXXXXX\n';
const banner = '\n  /$$$$$$   /$$$$$$  /$$$$$$$  /$$$$$$$  /$$   /$$\n /$$__  $$ /$$__  $$| $$__  $$| $$__  $$| $$  | $$\n| $$  \\ $$| $$$$$$$$| $$  \\ $$| $$  \\ $$| $$  | $$\n| $$  | $$| $$_____/| $$  | $$| $$  | $$| $$  | $$\n| $$$$$$$/|  $$$$$$$| $$  | $$| $$  | $$|  $$$$$$$\n| $$____/  \\_______/|__/  |__/|__/  |__/ \\____  $$\n| $$                                     /$$  | $$\n| $$                                    |  $$$$$$/\n|__/                                     \\______/\n'

console.log(chalk.magenta(banner));
console.log(chalk.blue(`version: ${pkg.version}`));
console.log(chalk.blue(`environment: ${isDev?'development':'production'}\n`));
api(baseDir, isDev);
