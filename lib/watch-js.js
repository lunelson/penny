const fs = require('fs');
const path = require('path');
const __basename = path.basename(__filename);

const webpack = require('webpack');
const memoryFs = new (require('memory-fs'))();
const chokidar = require('chokidar');
const _ = require('lodash');
const anymatch = require('anymatch');
const junk = require('junk');

const { pennyLogger, webpackLogger } = require('./util-loggers');
const { Deferral } = require('./util-general');
const { entryConfigurator } = require('./config-webpack');

/**
 *    _
 *   (_)
 *    _ ___
 *   | / __|
 *   | \__ \
 *   | |___/
 *  _/ |
 * |__/
 *
 * LIBS:
 *
 * webpack https://webpack.js.org/api/node/
 * memory-fs https://github.com/webpack/memory-fs
 *
 * TODO:
 * - allow to choose multiEntry X singleCompiler instead of multiCompiler X singleEntry
 */

const jsFiles = new Set();
const bufferCache = {};

let webpackInstance = null;
let webpackWatcher = null;

function watchJs(options, onEvent) {
  const { pubDir, logLevel, isBuild } = options;
  const configureEntry = entryConfigurator(options);
  webpackLogger.setLevel(logLevel);

  function webpackStart() {
    if (jsFiles.size == 0) return;
    webpackLogger.info(`starting compiler(s)`);

    webpackInstance = webpack([...jsFiles].map(configureEntry));
    webpackInstance.outputFileSystem = isBuild ? fs : memoryFs;

    webpackInstance.compilers.forEach(compiler => {
      const srcFile = compiler.options.entry;
      const outFile = path.join(compiler.options.output.path, compiler.options.output.filename);
      compiler.hooks.watchRun.tap('running', () => {
        webpackLogger.debug(`running ${path.relative(pubDir, srcFile)}`);
        onEvent(null, srcFile);
        if (!isBuild) {
          srcFile in bufferCache && delete bufferCache[srcFile];
          bufferCache[srcFile] = Deferral();
        }
      });
      compiler.hooks.afterEmit.tap('emitted', () => {
        webpackLogger.debug(`emitted ${path.relative(pubDir, srcFile)}`);
        if (!isBuild) {
          bufferCache[srcFile].resolve(webpackInstance.outputFileSystem.readFileSync(outFile));
        }
      });
    });

    webpackWatcher = webpackInstance.watch(
      {
        aggregateTimeout: 100,
        ignored: /node_modules/,
      },
      function errStatsHandler(err, stats) {
        if (err) {
          onEvent(err);
          webpackLogger.error(`{red:${__basename}}: `, err.stack || err, err.details);
          return;
        }
        if (stats) {
          const info = stats.toJson();
          if (stats.hasErrors()) {
            info.errors.forEach(onEvent);
            info.errors.forEach(err => webpackLogger.error(`{red:${__basename}}: `, err.toString()));
          }
          if (stats.hasWarnings())
            info.warnings.forEach(err => webpackLogger.warn(`{red:${__basename}}: `, err.toString()));
        }
      },
    );
  }

  const webpackRestart = _.debounce(() => {
    webpackLogger.info(`closing compiler(s)`);
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
          if (!~['add', 'unlink'].indexOf(fileEvent)) return;
          if (anymatch([junk.regex], path.basename(relFile))) return;

          pennyLogger.debug(`${fileEvent} js: ${relFile}`);

          const srcFile = path.join(pubDir, relFile);
          jsFiles[{ add: 'add', unlink: 'delete' }[fileEvent]](srcFile);
          fileEvent == 'unlink' && delete bufferCache[srcFile];
          if (webpackWatcher != null) webpackRestart();
        });

      watcher.on('ready', () => {
        webpackStart();
        resolve({
          watcher,
          webpackWatcher,
          close() {
            watcher.close();
            webpackWatcher.close();
          },
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  watchJs,
};
