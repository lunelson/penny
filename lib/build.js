// @ts-nocheck

const { relative } = require('path');

const _ = require('lodash');
const write = require('write');
const Listr = require('listr');

const { $data, watchData } = require('./watch-data');
const { $routes, watchSrc, srcCompilerMap } = require('./watch-src');
const { pennyLogger } = require('./util-loggers.js');
const { srcOutExts, shutdown } = require('./util-general.js');

module.exports = function(options) {
  const { srcDir, pubDir, outDir } = options;

  Object.assign(options, {
    onWatch(err) {
      if (err) return shutdown(err);
    },
    onCompile(err) {
      if (err) return shutdown(err);
    },
  });

  const tasks = new Listr(
    [
      {
        title: 'compile js entry files',
        task(ctx) {
          ctx.jsWatchInit = Promise.resolve('js');
          return;
        },
      },
      {
        title: 'gather and parse data files',
        task(ctx) {
          ctx.dataWatchInit = watchData(options, shutdown);
          return;
        },
      },
      {
        title: 'gather html/css entry files',
        task(ctx) {
          ctx.srcWatchInit = watchSrc(options, shutdown);
          return;
        },
      },
      {
        title: 'start watchers',
        task(ctx) {
          const { dataWatchInit, srcWatchInit, jsWatchInit } = ctx;
          return Promise.all([dataWatchInit, srcWatchInit, jsWatchInit]);
        },
      },
      {
        title: 'gather files',
        task(ctx) {
          return Promise.resolve();
        },
      },
      {
        title: '...and the next thing?',
        task(ctx) {
          return Promise.resolve();
        },
      },
    ],
    { collapse: false },
  );

  pennyLogger.info(
    `building from {magenta:@/${relative(process.cwd(), pubDir)}} to {magenta:@/${relative(
      process.cwd(),
      outDir,
    )}}\n`,
  );

  tasks.run().catch(err => shutdown(err));
};
