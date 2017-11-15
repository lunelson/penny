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
const cli = require('commander');

const api = require('./index-api');
const pkg = require('./package.json');

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

api(baseDir, isDev);
