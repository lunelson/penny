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

  webpackLogger.setLevel(logLevel);
  const configureEntry = entryConfigurator(options);

  function webpackStart() {
    if (jsFiles.size == 0) return;

    webpackLogger.info(`starting compiler(s)`);

    webpackInstance = webpack([...jsFiles].map(configureEntry));
    webpackInstance.outputFileSystem = isBuild ? fs : memoryFs;

    webpackInstance.compilers.forEach(compiler => {
      const srcFile = compiler.options.entry;
      const outFile = path.join(compiler.options.output.path, compiler.options.output.filename);

      compiler.hooks.watchRun.tap('running', () => {
        srcFile in bufferCache && delete bufferCache[srcFile];
        bufferCache[srcFile] = Deferral();
        onEvent(srcFile);

        webpackLogger.debug(`{yellow:${__basename}}: running ${path.relative(pubDir, srcFile)}`);
      });

      compiler.hooks.afterEmit.tap('emitted', () => {
        bufferCache[srcFile].resolve(webpackInstance.outputFileSystem.readFileSync(outFile));

        webpackLogger.debug(`{yellow:${__basename}}: emitted ${path.relative(pubDir, srcFile)}`);
      });
    });

    webpackWatcher = webpackInstance.watch(
      {
        aggregateTimeout: 150,
        ignored: /node_modules/,
      },
      function errStatsHandler(err, stats) {
        if (err) {
          webpackLogger.error(`{red:${__basename}}: `, err.stack || err);
          if (err.details) {
            webpackLogger.error(`{red:${__basename}}: `, err.details);
          }
          return;
        }
        if (stats) {
          const info = stats.toJson();
          if (stats.hasErrors())
            info.errors.forEach(err => webpackLogger.error(`{red:${__basename}}: `, err.toString()));
          if (stats.hasWarnings())
            info.warnings.forEach(err => webpackLogger.warn(`{red:${__basename}}: `, err.toString()));
        }
      },
    );
  }

  const webpackRestart = _.debounce(() => {
    webpackLogger.info(`closing compiler(s)`);
    webpackWatcher.close(() => {
      webpackStart();
    });
  }, 150);

  return new Promise((resolve, reject) => {
    try {
      const watcher = chokidar
        .watch(['**/*.js'], {
          ignored: ['**/_*/**/*.js', '**/_*.js', '**/*.min.js', '**/node_modules/**'],
          cwd: pubDir,
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
        resolve(watcher);
      });
    } catch (err) {
      reject(err);
    }
  });
}
