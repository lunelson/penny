#!/usr/bin/env node

'use-strict';

// npm
const path = require('path');
const chalk = require('chalk');
const cli = require('commander');

// local
const pkg = require('../package.json');

cli
  .version('0.1.0')
  .arguments('[command] [src] [dist]')
  .on('--help', function(){
    console.log('this is the help text');
  })
  .parse(process.argv);

function run({command='serve', src='.', dist}={}) {
    cli.help();
}(cli);

// if (!process.argv.slice(2).length) {
//   cli.outputHelp(make_red);
// }

// function make_red(txt) {
//   return colors.red(txt); //display the help text in red on the console
// }
