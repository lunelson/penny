/**
 *                _       _
 *               | |     | |
 * __      ____ _| |_ ___| |__ ______ ___ _ __ ___
 * \ \ /\ / / _` | __/ __| '_ \______/ __| '__/ __|
 *  \ V  V / (_| | || (__| | | |     \__ \ | | (__
 *   \_/\_/ \__,_|\__\___|_| |_|     |___/_|  \___|
 *
 *
 */

const fs = require('fs');
const path = require('path');
const __basename = path.basename(__filename);

const chokidar = require('chokidar');
const _ = require('lodash');
const anymatch = require('anymatch');
const grayMatter = require('gray-matter');
const junk = require('junk');
const changeCase = require('change-case');

const { pennyLogger } = require('./util-loggers');
const { mdExts, fileEventNames, cssSrcGlob, htmlSrcExtRE, srcExtRE } = require('./util-general');

const $routes = {};
const srcCompilers = new Map();

function watchSrc(options, onChange) {
  const { srcDir, pubDir, onParse } = options;
  options.$routes = $routes;

  return new Promise((resolve, reject) => {
    try {
      const watcher = chokidar
        /**
         * watch all files in srcDir
         */
        .watch(['**/*'], {
          ignored: ['**/node_modules/**', '_data/**'],
          cwd: srcDir,
        })
        .on('all', (fileEvent, relFile) => {
          /**
           * if junk file, return
           * if irrelevant event, return
           */
          if (anymatch([junk.regex], path.basename(relFile))) return;
          if (!~['change', 'add', 'unlink'].indexOf(fileEvent)) return;
          /**
           * resolve absFile wrt srcDir
           * re-resolve relFile wrt pubDir
           */
          const absFile = path.join(srcDir, relFile);
          relFile = path.relative(pubDir, absFile); // !! reset wrt pubDir !!
          /**
           * qualify entry files and html-entry files
           * classify by sourceType
           */
          const isEntry = anymatch([`**/*.${srcExtRE}`], relFile);
          const isHtmlEntry = anymatch([`**/*.${htmlSrcExtRE}`], relFile);
          const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relFile);
          // optional hidden tests...?
          // const isHiddenDir = anymatch(['**/_*/**/*.*'], relFile);
          // const isHiddenFile = anymatch(['**/_*.*'], relFile);
          let currentErr = null;
          /**
           * for html entry files, parse $route info
           */
          if (isHtmlEntry && !isHidden) {
            const route = '/' + relFile.replace(new RegExp(`\\.${htmlSrcExtRE}$`), '.html');
            if (fileEvent == 'unlink') {
              delete $routes[route];
            } else {
              let value = null;
              try {
                value = grayMatter(fs.readFileSync(absFile, 'utf8')).data;
                value.slug = value.slug || path.basename(relFile, path.extname(relFile));
                value.title =
                  value.title ||
                  changeCase.title(
                    route
                      .replace(/\.html$/, '')
                      .split('/')
                      .join(' '),
                  );
                $routes[route] = Object.assign({ route }, value || {});
                // pennyLogger.debug(`${fileEvent}: ${route} \n$route data:`, value);
              } catch (err) {
                currentErr = err;
                pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
              }
            }
          }
          /**
           * for entry files, create/destroy compiler instances
           */
          if (isEntry && !isHidden && !currentErr) {
            /**
             * if unlink, delete srcCompiler for absFile
             */
            if (fileEvent == 'unlink') {
              srcCompilers.delete(absFile);
            } else if (fileEvent == 'add') {
              try {
                /**
                 * test validity where srcExt is mdExt
                 */
                let srcExt = path.extname(absFile),
                  validSrc = true;
                if (~mdExts.indexOf(srcExt)) {
                  srcExt = '.md';
                  const { data } = grayMatter(fs.readFileSync(absFile, 'utf8'));
                  if (!('layout' in data)) validSrc = false;
                }
                /**
                 * if still validSrc, set new srcCompiler for absFile
                 */
                if (validSrc) {
                  const SrcCompiler = require(`./compile-${srcExt.slice(1)}`);
                  srcCompilers.set(absFile, new SrcCompiler(options, absFile));
                }
              } catch (err) {
                currentErr = err;
                pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
              }
            }
            pennyLogger.debug(`${fileEvent}: ${relFile}`);
          }
          /**
           * run onParse and onEvent
           */
          onParse(currentErr, absFile);
          fileEvent == 'change' && onChange(currentErr, absFile);
        });

      watcher.on('ready', () => resolve(watcher));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  watchSrc,
  srcCompilers,
  $routes,
};
