const { join, resolve, dirname, basename, relative } = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function errStatsHandler(err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }
  if (stats) {
    const info = stats.toJson();
    if (stats.hasErrors()) info.errors.forEach(err => console.error(err.toString()));
    if (stats.hasWarnings()) info.warnings.forEach(err => console.warn(err.toString()));
  }
}

const watchOptions = {
  aggregateTimeout: 200,
  ignored: /node_modules/,
};

function configCreator(srcDir, pubDir, options) {

  const { isDev } = options;

  const configureRules = require('./config-webpack-rules.js')(srcDir, pubDir, options);

  return function configureEntry(relFile) {
    const srcFile = join(pubDir, relFile);
    return {

      // CORE
      context: pubDir,
      entry: srcFile,
      output: {
        path: dirname(srcFile),
        filename: basename(srcFile),
        publicPath: `/${dirname(relative(pubDir, srcFile))}/`,
      },

      // OPTIONS
      mode: isDev ? 'development' : 'production',
      devtool: isDev ? 'source-map' : false,
      performance: { hints: isDev ? false : 'warning', },

      // MODULES / LOADERS
      module: {
        // NB: noParse option is interesting
        // noParse: (content) => /jquery|lodash/.test(content),
        rules: configureRules(srcFile),
      },

      // PLUGINS
      // to consider:
      // - CompressionWebpackPlugin || ZopfliWebpackPlugin
      // - DotEnv https://github.com/mrsteele/dotenv-webpack
      plugins: [
        new VueLoaderPlugin(),
        !isDev &&
          new MiniCssExtractPlugin({
            filename: '[name].js.css',
          }),
      ].filter(val => val),

      // RESOLVE https://webpack.js.org/configuration/resolve/
      resolve: {
        mainFields: ['module', 'main', 'browser'],
        modules: [resolve(__dirname, '../node_modules'), 'node_modules'],
      },

      // RESOLVE LOADER https://webpack.js.org/configuration/resolve/#resolveloader
      resolveLoader: {
        modules: [resolve(__dirname, '../node_modules'), 'node_modules'],
      },
    };
  };
}

module.exports = {
  watchOptions,
  errStatsHandler,
  configCreator,
};
