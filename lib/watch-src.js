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
const junk = require('junk');
const changeCase = require('change-case');
const grayMatter = require('gray-matter');
const UrlPattern = require('url-pattern');

const { pennyLogger } = require('./util-loggers');
const { mdExts, htmlSrcExtGroup, srcExtGroup } = require('./util-general');

/**
 * INIT MAPS for pages and srcCompilers
 *
 * staticRouteMap
 *   route -> { route, srcFile, ...srcObj }
 *
 * dynamicRouteMap
 *   pattern -> { pattern, matcher, srcFile, ...srcObj }
 */
const srcCompilerMap = new Map();
const staticRouteMap = new Map();
const dynamicRouteMap = new Map();

const $routes = [];
// $routes.match(pattern) => [combined list of static routes and render routes]
$routes.match = function(pattern) {
  return _.compact(
    this.map($route => {
      const result = new UrlPattern(`${pattern}(.html)`).match($route.route);
      return result ? Object.assign($route, result) : result;
    }),
  );
};

function updateRoutes() {
  /*
    updating $routes, combining static and dynamic:
      1. get dynamicRouteMap.entries
      2. get penny options { renderRoutes }
         do renderRoutes.map(route => matchers)
          if match, return spread of dynamic srcObj with static { route }
      3. spread in the staticRouteMap.entries
      DONE

  */
}

function watchSrc(options, onChange) {
  const { srcDir, pubDir, onWatch } = options;

  options.$routes = $routes;

  return new Promise((resolve, reject) => {
    try {
      /**
       * watch all files in srcDir
       *   excluding _data and node_modules
       *
       * on all file events:
       *   qualify, resolve and categorize filenames
       */
      const watcher = chokidar
        .watch(['**/*'], {
          ignored: ['**/node_modules/**', '_data/**'],
          cwd: srcDir,
        })
        .on('all', (fileEvent, relFile) => {
          // if junk file OR irrelevant event, return
          if (anymatch([junk.regex], path.basename(relFile))) return;
          if (!~['change', 'add', 'unlink'].indexOf(fileEvent)) return;
          // resolve absFile wrt srcDir; re-resolve relFile wrt pubDir
          const absFile = path.join(srcDir, relFile);
          relFile = path.relative(pubDir, absFile); // !! reset wrt pubDir !!
          // qualify entry, html-entry, dynamic and hidden files
          const isEntry = anymatch([`**/*.${srcExtGroup}`], relFile);
          const isHtmlEntry = anymatch([`**/*.${htmlSrcExtGroup}`], relFile);
          const isDynamic = anymatch(['**/$*/**/*.*', '**/$*.*'], relFile);
          const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relFile);
          // create err
          let watchErr = null;
          /**
           * STATIC HTML ENTRY FILES:
           * if unlink, delete entry for $page in staticRouteMap
           * else
           *   parse $page info
           *   set entry for $page in staticRouteMap
           */
          if (isHtmlEntry && !isHidden && !isDynamic) {
            const route =
              '/' +
              relFile.replace(new RegExp(`\\.${htmlSrcExtGroup}$`), '.html');
            if (fileEvent == 'unlink') {
              staticRouteMap.delete(route); // if unlink, delete entry for $page obj
            } else {
              let value = null;
              try {
                value = grayMatter(fs.readFileSync(absFile, 'utf8')).data;
                // NB: this logic can be extracted to parse renderRoutes from penny options
                value.slug =
                  value.slug || path.basename(relFile, path.extname(relFile));
                value.title =
                  value.title ||
                  changeCase.title(
                    route
                      .replace(/\.html$/, '')
                      .split('/')
                      .join(' '),
                  );
                staticRouteMap.set(
                  route,
                  Object.assign(value || {}, {
                    route,
                    srcFile: path.relative(srcDir, absFile),
                  }),
                );
              } catch (err) {
                watchErr = err;
                pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
              }
            }
          }
          /**
           * DYNAMIC HTML ENTRY FILES:
           * if unlink, delete entry for $page in dynamicRouteMap
           * else
           *   parse $page info
           *   set entry for $page in dynamicRouteMap
           */
          if (isHtmlEntry && !isHidden && isDynamic) {
            const pattern =
              '/' +
              relFile
                .replace(new RegExp(`\\.${htmlSrcExtGroup}$`), '(.html)')
                .replace(/\$/g, ':');
            const matcher = new UrlPattern(pattern);
            if (fileEvent == 'unlink') {
              dynamicRouteMap.delete(pattern); // if unlink, delete entry for $page obj
            } else {
              let value = null;
              try {
                value = grayMatter(fs.readFileSync(absFile, 'utf8')).data;
                dynamicRouteMap.set(
                  pattern,
                  Object.assign(value || {}, {
                    pattern,
                    matcher,
                    srcFile: path.relative(srcDir, absFile),
                  }),
                );
              } catch (err) {
                watchErr = err;
                pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
              }
            }
          }
          /**
           * HTML/CSS ENTRY FILES:
           * if unlink, delete entry for compiler in srcCompilers
           * create/destroy compiler instances
           */
          if (isEntry && !isHidden && !watchErr) {
            if (fileEvent == 'unlink') {
              srcCompilerMap.delete(absFile);
            } else if (!srcCompilerMap.has(absFile)) {
              try {
                // test validity where srcExt is mdExt
                let srcExt = path.extname(absFile),
                  validSrc = true;
                if (~mdExts.indexOf(srcExt)) {
                  srcExt = '.md';
                  const { data } = grayMatter(fs.readFileSync(absFile, 'utf8'));
                  if (!('layout' in data)) validSrc = false;
                }
                // if still validSrc, set new srcCompiler for absFile
                if (validSrc) {
                  const SrcCompiler = require(`./compile-${srcExt.slice(1)}`);
                  srcCompilerMap.set(
                    absFile,
                    new SrcCompiler(absFile, options),
                  );
                }
              } catch (err) {
                watchErr = err;
                pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
              }
            }
            pennyLogger.debug(`${fileEvent}: ${relFile}`);
          }
          /**
           * run onParse and onEvent
           */
          onWatch(watchErr, absFile);
          fileEvent == 'change' && onChange(watchErr, absFile);
        });

      watcher.on('ready', () => resolve(watcher));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  watchSrc,
  srcCompilerMap,
  staticRouteMap,
  dynamicRouteMap,
  $routes,
};
