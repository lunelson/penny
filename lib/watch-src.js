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
const regexparam = require('regexparam'); // https://github.com/lukeed/regexparam

const { pennyLogger } = require('./util-loggers');
const { mdExts, htmlSrcExtGroup, srcExtGroup } = require('./util-general');

const srcCompilerMap = new Map();
const dynamicPageMap = new Map();
const staticPageMap = new Map();

const $pages = [];

$pages.match = function(pattern) {
  return _.compact(
    this.map($route => {
      const result = new UrlPattern(`${pattern}(.html)`).match($route.route);
      return result ? Object.assign($route, result) : result;
    }),
  );
};

function updatePages() {
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
  const { srcDir, pubDir, onWatch } = options;

  options.$routes = $pages;

  return new Promise((resolve, reject) => {
    try {
      const watcher = chokidar
        .watch(['**/*'], {
          ignored: ['**/node_modules/**', '_data/**'],
          cwd: srcDir, // all files in srcDir!
        })
        .on('all', (fileEvent, relSrc) => {
          if (!~['change', 'add', 'unlink'].indexOf(fileEvent)) return;
          if (anymatch([junk.regex], path.basename(relSrc))) return;

          // resolve absFile wrt srcDir; re-resolve relFile wrt pubDir
          const absSrc = path.join(srcDir, relSrc);
          relSrc = path.relative(pubDir, absSrc); // !! reset wrt pubDir !!

          // qualify entry, html-entry, dynamic and hidden files
          const isEntry = anymatch([`**/*.${srcExtGroup}`], relSrc);
          const isHtml = anymatch([`**/*.${htmlSrcExtGroup}`], relSrc);
          const isDynamic = anymatch(['**/$*/**/*.*', '**/$*.*'], relSrc);
          const isHidden = anymatch(['**/_*/**/*.*', '**/_*.*'], relSrc);

          // create err
          let error = null;

          /**
           * HTML ENTRY FILES:
           * track each $page, and reqpath or matcher
           */
          if (isHtml && !isHidden) {
            const reqpath = `/${relSrc.replace(new RegExp(`\\.${htmlSrcExtGroup}$`), '.html')}`;
            const pageMap = isDynamic ? dynamicPageMap : staticPageMap;
            const pageRef = isDynamic
              ? { matcher: regexparam(reqpath.replace(/\$/g, ':')) }
              : { reqpath };
            if (fileEvent == 'unlink') {
              pageMap.delete(absSrc); // if unlink, delete entry for $page obj
            } else {
              try {
                const { data: $page } = grayMatter(fs.readFileSync(absSrc, 'utf8'));
                $page.slug = $page.slug || path.basename(relSrc, path.extname(relSrc));
                $page.title =
                  $page.title ||
                  changeCase.title(
                    reqpath
                      .replace(/\.html$/, '')
                      .split('/')
                      .join(' '),
                  );
                pageMap.set(absSrc, { $page, ...pageRef });
              } catch (err) {
                error = err;
                pennyLogger.error(`{red:${__basename}}: ${err.message}`, err);
              }
            }
          }
          /**
           * HTML/CSS ENTRY FILES:
           * create/destroy compiler instances
           */
          if (isEntry && !isHidden && !error) {
            if (fileEvent == 'unlink') {
              srcCompilerMap.delete(absSrc);
            } else if (!srcCompilerMap.has(absSrc)) {
              try {
                let srcExt = path.extname(absSrc),
                  validSrc = true;
                if (~mdExts.indexOf(srcExt)) {
                  srcExt = '.md';
                  const { $page } = staticPageMap.get(absSrc) || dynamicPageMap.get(absSrc);
                  if (!('layout' in $page)) validSrc = false;
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
          /**
           * run onParse and onEvent
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
  staticRouteMap: staticPageMap,
  dynamicRouteMap: dynamicPageMap,
  $routes: $pages,
};
