/**
 *                _       _           _
 *               | |     | |         (_)
 * __      ____ _| |_ ___| |__ ______ _ ___
 * \ \ /\ / / _` | __/ __| '_ \______| / __|
 *  \ V  V / (_| | || (__| | | |     | \__ \
 *   \_/\_/ \__,_|\__\___|_| |_|     | |___/
 *                                  _/ |
 *                                 |__/
 * LIBS:
 * webpack https://webpack.js.org/api/node/
 * memory-fs https://github.com/webpack/memory-fs
 *
 * TODO:
 * - allow to choose multiEntry X singleCompiler instead of multiCompiler X singleEntry
 * - rename:
 *   jsEntryFiles
 *   jsStreamCache
 *   jsMemoryFs
 *   webpackCache
 *   webpackFs
 */

const fs = require('fs');
const path = require('path');
const __basename = path.basename(__filename);

const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const chokidar = require('chokidar');
const _ = require('lodash');
const anymatch = require('anymatch');
const junk = require('junk');

// const { pennyLogger, webpackLogger } = require('./util-loggers');
const { Deferral } = require('./util-general');
const configWebpack = require('./config-webpack');

const entrySet = new Set();
const memoryFs = new MemoryFS();
const streamCache = {};

let webpackInstance = null;
let webpackWatcher = null;

function watchJs(options, onFileEvent) {
  const { pubDir, outDir, logLevel, isBuild } = options;

  function webpackStart() {
    if (entrySet.size == 0) return false;
    webpackInstance = webpack([...entrySet].map(entry => configWebpack(entry, options)));
    webpackInstance.outputFileSystem = isBuild ? fs : memoryFs;
    webpackInstance.compilers.forEach(compiler => {
      // TODO: double check these values
      const relFile = path.join(compiler.options.entry);
      const srcFile = path.join(compiler.options.context, compiler.options.entry);
      const outFile = path.join(compiler.options.output.path, compiler.options.output.filename);

      // set hook for start
      compiler.hooks.watchRun.tap('penny', () => {
        onFileEvent(null, srcFile);
        // webpackLogger.debug(`starting: {magenta:${relFile}}`);
        if (!isBuild) {
          outFile in streamCache && delete streamCache[outFile];
          streamCache[outFile] = Deferral();
        }
      });

      // set hook for completion
      compiler.hooks.afterEmit.tap('penny', () => {
        onFileEvent(null, srcFile);
        // webpackLogger.debug(`emitted: {magenta:${relFile}}`);
        if (!isBuild) {
          streamCache[outFile].resolve(memoryFs.createReadStream(outFile));
        }
      });
    });

    // https://webpack.js.org/api/node/#error-handling
    webpackWatcher = webpackInstance.watch(
      { aggregateTimeout: 100, ignored: /node_modules/ },
      (err, stats) => {
        if (err) {
          // webpackLogger.error(`{red:${__basename}}: `, err.stack || err, err.details || '');
          return onFileEvent(err, 'webpack');
        }
        if (stats) {
          const info = stats.toJson();
          if (stats.hasErrors()) {
            // info.errors.forEach(err =>
            //   webpackLogger.error(`{red:${__basename}}: `, err.toString()),
            // );
            return onFileEvent(info.errors, 'webpack');
          }
          if (stats.hasWarnings()) {
            // info.warnings.forEach(err =>
            //   webpackLogger.warn(`{red:${__basename}}: `, err.toString()),
            // );
            return;
          }
        }
      },
    );
  }

  const webpackRestart = _.debounce(() => {
    // webpackLogger.info(`closing compiler(s)`);
    webpackWatcher.close(webpackStart);
  }, 100);

  return new Promise((resolve, reject) => {
    try {
      const watcher = chokidar
        .watch(['**/*.js'], {
          cwd: pubDir,
          ignored: ['**/_*/**/*.js', '**/_*.js', '**/*.min.js', '**/node_modules/**'],
        })
        .on('all', (fileEvent, relFile) => {
          if (anymatch([junk.regex], path.basename(relFile))) return;
          if (!~['add', 'unlink'].indexOf(fileEvent)) return;

          // pennyLogger.debug(`${fileEvent} js: ${relFile}`);
          // add or delete files from entrySet AND streamCache
          entrySet[{ add: 'add', unlink: 'delete' }[fileEvent]](`./${relFile}`);
          fileEvent == 'unlink' && delete streamCache[path.join(outDir, relFile)];

          // restart the webpackWatcher
          if (webpackWatcher != null) webpackRestart();
        });

      watcher.on('ready', () => {
        webpackStart();
        resolve(watcher);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  watchJs,
  memoryFs,
  streamCache,
};
