#!/usr/bin/env node

'use-strict';

// npm
const path = require('path');
const chalk = require('chalk');
const cli = require('commander');

// local
const pkg = require('../package.json');

cli
  .version(pkg.version, '-v, --version');
// .on('*', (command) => { console.log( process.argv )});

cli
  .command('serve [src]')
  .description('serve source directory')
  .action((src = '.') => { console.log(`

    serving from ${src}

`); });

cli
  .command('build <src> <dist>')
  .description('build source directory to destination')
  .action((src, dist) => { console.log(`

    building from ${src}

`); });
// cli
//   .command('*')
//   .action((src = '.') => { console.log(`serving from ${src}`); });

cli
  .parse(process.argv);

if (cli.args.length < 1) cli._events['command:serve']();

// const baseDir = path.resolve(process.cwd(), cli.src);
// const isDev = !(process.env.NODE_ENV == 'production');
const banner = '\n  /¢¢¢¢¢¢   /¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢¢¢¢¢¢  /¢¢   /¢¢\n /¢¢__  ¢¢ /¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢__  ¢¢| ¢¢  | ¢¢\n| ¢¢  \\ ¢¢| ¢¢¢¢¢¢¢¢| ¢¢  \\ ¢¢| ¢¢  \\ ¢¢| ¢¢  | ¢¢\n| ¢¢  | ¢¢| ¢¢_____/| ¢¢  | ¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢\n| ¢¢¢¢¢¢¢/|  ¢¢¢¢¢¢¢| ¢¢  | ¢¢| ¢¢  | ¢¢|  ¢¢¢¢¢¢¢\n| ¢¢____/  \\_______/|__/  |__/|__/  |__/ \\____  ¢¢\n| ¢¢                                     /¢¢  | ¢¢\n| ¢¢                                    |  ¢¢¢¢¢¢/\n|__/                                     \\______/\n';
console.log(chalk.magenta(banner));

// console.log();

// console.log(chalk.blue(`version: ${pkg.version}`));
// console.log(chalk.blue(`environment: ${isDev?'development':'production'}\n`));

// api(baseDir, isDev);

/*
  pattern 3: fallback to a catchall command, if nothing else
  commands require params

  cli.version
  cli
    .command
    .description
    .action(...)

  cli
    .command
    .description
    .action(...)

  cli
    .command('*')
    .action(...)

    */

    /*
    pattr 4: simple arguments but no auto help. requires writing custom help
    NB: console.error and process.exit(1)

    cli
      .version
      .arguments('[command] [src] [dist]')
      .action((command, src, dist) => {

      })

    cli
      .on('--help', function(){
        console.log('  Examples:');
        console.log('');
        console.log('    $ custom-help --help');
        console.log('    $ custom-help -h');
        console.log('');
      });

*/
