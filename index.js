#!/usr/bin/env node
//                               _
//                              (_)
//  _ __   ___ _ __   __ _ _   _ _ _ __
// | '_ \ / _ \ '_ \ / _` | | | | | '_ \
// | |_) |  __/ | | | (_| | |_| | | | | |
// | .__/ \___|_| |_|\__, |\__,_|_|_| |_|
// | |                __/ |
// |_|               |___/

'use-strict';

const program = require('commander');
const path = require('path');
const pkg = require('./package.json');
const cosmiconfig = require('cosmiconfig');

/*
  COMMANDER
  options:
    -b, --base: which directory to serve
    -p, --prod: production mode flag
*/

program
  .version(pkg.version)
  .option('-p, --prod', 'set production mode flag (falls back to NODE_ENV)') // boolean, cause no capture value. default false
  .option('-b, --base [directory]', 'specify directory to serve (defaults to current)', '.')
  .parse(process.argv);

const baseDir = path.resolve(process.cwd(), program.base);
const isDev = !(program.prod != undefined);

// TEST
console.log(baseDir, isDev);

/*
  COSMICONFIG https://github.com/davidtheclark/cosmiconfig
  potential options:
    browsersList -- array of browserslist strings
    reqSrcExts -- map of src extensions per req extension
*/

var config = cosmiconfig('penguin')
  .load(baseDir)
  .then((result) => {

    // TEST
    console.log(result.config, result.filepath);
  })
  .catch((err) => {
    console.log(err);
  });

