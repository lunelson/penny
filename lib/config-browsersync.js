const fs = require('fs');
// const path = require('path');

const browserifyResolve = require('resolve');
const serveFavicon = require('serve-favicon');
const _ = require('lodash');

exports.configureBsync = function(options, middleware) {
  const { srcDir, pubDir, logLevel, browserSyncOptions, onStart } = options;

  const httpModule = require(browserifyResolve.sync('http2', { basedir: srcDir }));
  const clientJs = fs.readFileSync(require.resolve('./config-browsersync-osd.js'), 'utf8');
  const faviconMiddleware = serveFavicon(require.resolve('../assets/favicon.ico'));

  return {
    notify: false,
    open: false,
    files: false,
    logConnections: true,
    logPrefix: 'browsersync',
    server: {
      baseDir: pubDir,
      serveStaticOptions: {
        /**
         * TODO: verify that these are standard on most static servers
         */
        extensions: ['html', 'htm'],
      },
    },
    middleware: [faviconMiddleware, middleware],
    httpModule,
    https: true,
    plugins: [
      {
        'plugin:name': 'OSD',
        plugin: function() {},
        hooks: { 'client:js': clientJs },
      },
    ],
  };
};