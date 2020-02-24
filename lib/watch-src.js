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

const chokidar = require('chokidar');
const _ = require('lodash');
const anymatch = require('anymatch');
const junk = require('junk');
const changeCase = require('change-case');
const grayMatter = require('gray-matter');
const regexparam = require('regexparam'); // https://github.com/lukeed/regexparam

const { pennyLogger } = require('./util-loggers');
const { mdExts, htmlSrcExtGroup, srcExtGroup } = require('./util-general');

const __basename = path.basename(__filename);
const srcCompilerMap = new Map();
const dynamicRouteMap = new Map();
const staticRouteMap = new Map();

const $routes = [];

$routes.match = function(pattern) {
  return _.compact(
    this.map($route => {
      // TODO: change this to use regexparam instead; it's already tested
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

function watchSrc(options, onFileEvent) {
  const { srcDir, pubDir } = options;

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
        .on('all', (fileEvent, relSrc) => {
          if (!~['change', 'add', 'unlink'].indexOf(fileEvent)) return;
          if (anymatch([junk.regex], path.basename(relSrc))) return;
          /**
           * resolve absFile wrt srcDir
           * re-resolve relFile wrt pubDir !!
           * qualify entry, html-entry, dynamic and hidden files
           * let error
           */
          const absSrc = path.join(srcDir, relSrc);
          relSrc = path.relative(pubDir, absSrc);
          let error = null;
          const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relSrc);
          if (!isHidden) {
            const isHtml = anymatch([`**/*.${htmlSrcExtGroup}`], relSrc);
            const isEntry = anymatch([`**/*.${srcExtGroup}`], relSrc);
            const isDynamic = anymatch(['**/$*/**/*.*', '**/$*.*'], relSrc);
            /**
             * for HTML entry files:
             * track each $route, and reqpath or matcher
             */
            if (isHtml) {
              const reqpath = `/${relSrc.replace(new RegExp(`\\.${htmlSrcExtGroup}$`), '.html')}`;
              const routeMap = isDynamic ? dynamicRouteMap : staticRouteMap;
              const routeRef = isDynamic
                ? { matcher: regexparam(reqpath.replace(/\$/g, ':')) }
                : { reqpath };
              if (fileEvent == 'unlink') {
                routeMap.delete(absSrc); // if unlink, delete entry for $route obj
              } else {
                try {
                  const { data: $route } = grayMatter(fs.readFileSync(absSrc, 'utf8'));
                  $route.slug = $route.slug || path.basename(relSrc, path.extname(relSrc));
                  $route.title =
                    $route.title ||
                    changeCase.title(
                      reqpath
                        .replace(/\.html$/, '')
                        .split('/')
                        .join(' '),
                    );
                  routeMap.set(absSrc, { $route, ...routeRef });
                } catch (err) {
                  error = err;
                  pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
                }
              }
            }
            /**
             * for HTML/CSS entry files:
             * create/destroy compiler instances
             */
            if (isEntry && !error) {
              if (fileEvent == 'unlink') {
                srcCompilerMap.delete(absSrc);
              } else if (!srcCompilerMap.has(absSrc)) {
                try {
                  let srcExt = path.extname(absSrc),
                    validSrc = true;
                  if (~mdExts.indexOf(srcExt)) {
                    srcExt = '.md';
                    const { $route } = staticRouteMap.get(absSrc) || dynamicRouteMap.get(absSrc);
                    if (!('layout' in $route)) validSrc = false;
                  }
                  if (validSrc) {
                    const Compiler = require(`./compile-${srcExt.slice(1)}`);
                    srcCompilerMap.set(absSrc, new Compiler(absSrc, options));
                  }
                } catch (err) {
                  error = err;
                  pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
                }
              }
              pennyLogger.debug(`${fileEvent}: ${relSrc}`);
            }
          }
          /**
           * run onFileEvent, all src files  (hidden or not)
           */
          onFileEvent(error, absSrc);
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
