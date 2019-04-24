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
const MemoryFileSystem = require('memory-fs');
const chokidar = require('chokidar');
const _ = require('lodash');
const anymatch = require('anymatch');
const junk = require('junk');

const { pennyLogger, webpackLogger } = require('./util-loggers');
const { Deferral } = require('./util-general');
const { entryConfigurator } = require('./config-webpack');

const entryFiles = new Set();
const memoryFs = new MemoryFileSystem();
const streamCache = {};

let webpackInstance = null;
let webpackWatcher = null;

function watchJs(options, onChange) {
  const { pubDir, outDir, logLevel, isBuild, onParse, onCompile } = options;
  const configureEntry = entryConfigurator(options);
  webpackLogger.setLevel(logLevel);

  function webpackStart() {
    /**
     * if no js files, return
     */
    if (entryFiles.size == 0) return;
    webpackLogger.info(`starting compiler(s)`);
    /**
     * create webpack instance by passing config(s)
     * TODO: add option
     * (A) array of configs (multi-compiler)
     * (B) single config with entry -> array||object of entries
     * NB: the syntax is super fucking tricky
     * review https://webpack.js.org/concepts/output#multiple-entry-points
     */
    webpackInstance = webpack([...entryFiles].map(configureEntry));
    /**
     * set filesystem to memoryFs if not building
     */
    webpackInstance.outputFileSystem = isBuild ? fs : memoryFs;

    webpackInstance.compilers.forEach(compiler => {
      /**
       * NB: double check this path parsing WRT config format
       */
      const relFile = path.join(compiler.options.entry);
      const srcFile = path.join(compiler.options.context, compiler.options.entry);
      const outFile = path.join(compiler.options.output.path, compiler.options.output.filename);
      /**
       * set hook: file change / compilation start
       */
      compiler.hooks.watchRun.tap('penny', () => {
        onChange(null, srcFile);
        webpackLogger.debug(`starting: {magenta:${relFile}}`);
        if (!isBuild) {
          outFile in streamCache && delete streamCache[outFile];
          streamCache[outFile] = Deferral();
        }
      });
      /**
       * set hook: compilation success
       */
      compiler.hooks.afterEmit.tap('penny', () => {
        onCompile(null, srcFile);
        webpackLogger.debug(`emitted: {magenta:${relFile}}`);
        if (!isBuild) {
          streamCache[outFile].resolve(webpackInstance.outputFileSystem.createReadStream(outFile));
        }
      });
    });

    webpackWatcher = webpackInstance.watch(
      {
        aggregateTimeout: 100,
        ignored: /node_modules/,
      },
      (err, stats) => {
        /**
         * handle webpack errors
         * ref https://webpack.js.org/api/node/#error-handling
         */
        if (err) {
          /**
           * TODO: determine if this err is a compilation or other type of error ?
           */
          onCompile(err);
          webpackLogger.error(`{red:${__basename}}: `, err.stack || err, err.details || '');
          return;
        }
        if (stats) {
          const info = stats.toJson();
          if (stats.hasErrors()) {
            info.errors.forEach(onCompile);
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
        /**
         * watch all js files in pubDir
         */
        .watch(['**/*.js'], {
          cwd: pubDir,
          ignored: ['**/_*/**/*.js', '**/_*.js', '**/*.min.js', '**/node_modules/**'],
        })
        .on('all', (fileEvent, relFile) => {
          /**
           * if junk file, return
           * if neither add nor unlink, return
           */
          if (anymatch([junk.regex], path.basename(relFile))) return;
          if (!~['add', 'unlink'].indexOf(fileEvent)) return;
          /**
           * add or delete relFile from jsFiles
           * if unlink, delete also from bufferCache
           */
          // const entryFile = `./${relFile}`;
          entryFiles[{ add: 'add', unlink: 'delete' }[fileEvent]](`./${relFile}`);
          fileEvent == 'unlink' && delete streamCache[path.join(outDir, relFile)];
          /**
           * restart webpack if watcher instance is non-null
           */
          if (webpackWatcher != null) webpackRestart();
          /**
           * run onParse and onChange (not necessary here)
           * report for debugging
           */
          // const absFile = path.join(pubDir, relFile);
          // onParse(null, absFile);
          // fileEvent == 'change' && onChange(null, absFile);
          pennyLogger.debug(`${fileEvent} js: ${relFile}`);
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
