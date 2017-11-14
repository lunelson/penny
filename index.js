#!/usr/bin/env node

//                               _                 _ _
//                              (_)               | (_)
//  _ __   ___ _ __   __ _ _   _ _ _ __ ______ ___| |_
// | '_ \ / _ \ '_ \ / _` | | | | | '_ \______/ __| | |
// | |_) |  __/ | | | (_| | |_| | | | | |    | (__| | |
// | .__/ \___|_| |_|\__, |\__,_|_|_| |_|     \___|_|_|
// | |                __/ |
// |_|               |___/

'use-strict';

const cosmiconfig = require('cosmiconfig');
const program = require('commander');
const path = require('path');
const pkg = require('./package.json');

/*
  COMMANDER
  options:
    -b, --base: which directory to serve
    -p, --prod: production mode flag (will also check NODE_ENV)
*/

program
  .version(pkg.version)
  .option('-p, --prod', 'set production mode flag (falls back to NODE_ENV)') // boolean, cause no capture value. default false
  .option('-b, --base [directory]', 'specify directory to serve (defaults to current)', '.')
  .parse(process.argv);

const baseDir = path.resolve(process.cwd(), program.base);
const isDev = !(program.prod != undefined || process.env.NODE_ENV == 'production');

/*
  COSMICONFIG https://github.com/davidtheclark/cosmiconfig
  potential options:
    browsersList -- array of browserslist strings
    reqSrcExts -- map of src extensions per req extension
*/

let config = {};
const configFinder = cosmiconfig('penguin', { stopDir: baseDir, rcExtensions: true })
  .load(baseDir)
  .then((result) => ({ config } = result ))
  .catch((err) => console.log('no config file found'));

/*
  SERVER
*/

Promise.resolve(configFinder).then(()=>{
  // TEST
  console.log(baseDir, isDev, config);
});

