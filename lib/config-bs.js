const fs = require('fs');

const serveFavicon = require('serve-favicon');
const _ = require('lodash');
const clientJs = fs.readFileSync(require.resolve('./config-bs-client.js'), 'utf8');

exports.configBS = function(options, middleware) {
  const { srcDir, pubDir, logLevel, browserSyncOptions, onStart } = options;

  // NB: resolving penny-installed http2, not node-native module
  const httpModule = require(require('resolve').sync('http2', { basedir: srcDir }));
  const faviconMiddleware = serveFavicon(require.resolve('../assets/favicon.ico'));

  return {
    open: false,
    files: false,
    notify: false,
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
    middleware: [faviconMiddleware],
    https: true,
    httpModule,
    plugins: [
      {
        'plugin:name': 'OSD',
        plugin: function() {},
        hooks: { 'client:js': clientJs },
      },
    ],
  };
};
