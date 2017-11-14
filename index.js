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

const cli = require('commander');
const path = require('path');

cli
  .version('0.9.0')
  .option('-p, --prod', 'set production mode flag (falls back to NODE_ENV)') // boolean, cause no capture value. default false
  .option('-b, --base [directory]', 'specify directory to serve (defaults to current)', '.')
  .parse(process.argv);

const baseDir = path.resolve(process.cwd(), cli.base);
