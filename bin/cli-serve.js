#!/usr/bin/env node

'use-strict';

// npm
const path = require('path');
const chalk = require('chalk');
const cli = require('commander');

cli.parse(process.argv);

console.log(`serving: ${path.resolve(process.cwd(), cli.src||'.')}`);
