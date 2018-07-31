/*
  webpack config questions
  - automate babel config?
    https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/babel-preset-app
  - automate vue-loader config?
    https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/babel-preset-app
    https://vue-loader.vuejs.org/

  OTHER
  - Sass may also reference URLs; see here for tips
    https://github.com/webpack-contrib/sass-loader

  - CSS can be extracted for production, to have same basename as js file
    https://github.com/webpack-contrib/mini-css-extract-plugin

  - vue-style-loader is a fork of style-loader
    https://github.com/vuejs/vue-style-loader
    https://www.npmjs.com/package/style-loader
*/

const { resolve, dirname, basename, relative } = require('path');
const babelPresetEnv = require('@babel/preset-env');
const babelPluginORS = require('@babel/plugin-proposal-object-rest-spread');
const babelResolver = require('babel-plugin-module-resolver');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sassFunctions = require('./functions-sass.js');

function errStatsHandler(err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) { console.error(err.details); }
    return;
  }
  const info = stats.toJson();
  if (stats.hasErrors()) { console.error(info.errors); }
  if (stats.hasWarnings()) { console.warn(info.warnings); }
}

const watchOptions = {
  aggregateTimeout: 200,
  ignored: /node_modules/,
}

function configCreator(srcDir, outDir=null, options) {

  const { isDev, browsers } = options;

  return function configureEntry(relFile) {
    const srcFile = resolve(srcDir, relFile);
    const outFile = outDir?resolve(outDir, relFile):srcFile;
    const sassFns = sassFunctions(srcDir, srcFile);
    return {

      //
      // CORE
      //
      context: srcDir,
      entry: srcFile,
      output: {
        path: dirname(outFile),
        filename: basename(outFile),
        publicPath: `/${dirname(relative(srcDir, srcFile))}/`,
      },

      // OPTIONS
      // mode: https://webpack.js.org/concepts/mode/#usage
      mode: isDev?'development':'production',
      devtool: isDev?'eval-source-map':false,
      performance: { hints: isDev?false:'warning', },

      // MODULES / LOADERS
      module: {
        rules: [
          {
            test: /\.pug$/,
            loader: 'pug-plain-loader',
            options: {
              basedir: srcDir,
              cache: false,
              debug: false,
              doctype: 'html',
              globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
              name: false,
              pretty: isDev,
              self: false,
            }
          },
          {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
              hotReload: false,
            }
          },
          // this will apply to both plain `.js` files
          // AND `<script>` blocks in `.vue` files
          {
            test: /\.js$/,
            loader: 'babel-loader',
            options: {
              babelrc: false,
              exclude: /node_modules/, // don't babelify modules
              sourceMap: isDev,
              cacheDirectory: isDev,
              presets: [
                [babelPresetEnv, {
                  modules: false,
                  targets: { browsers },
                  useBuiltIns: 'usage',
                  shippedProposals: true
                }]
              ],
              plugins: [
                [babelPluginORS, { useBuiltIns: true }],
                [babelResolver, { root: srcDir }],
                // !isDev && babelLodash,
              ].filter(val => val)
            }
          },
          // this will apply to both plain `.css` files
          // AND `<style>` blocks in `.vue` files
          {
            test: /\.css$/,
            use: [
              process.env.NODE_ENV !== 'production' ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
              'css-loader',
              'postcss-loader',
            ]
          },
          {
            test: /\.scss$/,
            use: [
              {
                loader: 'vue-style-loader',
                options: { hmr: false }
              },
              {
                loader: 'css-loader'
              },
              {
                loader: 'postcss-loader'
              },
              {
                loader: 'sass-loader',
                options: {
                  includePaths: ['node_modules'],
                  outputStyle: isDev?'nested':'compressed',
                  sourceMap: false,
                  functions: sassFns.instance,
                }
              }
            ]
          }
        ]
      },

      // PLUGINS
      // to consider:
      // - CompressionWebpackPlugin || ZopfliWebpackPlugin
      // - DotEnv https://github.com/mrsteele/dotenv-webpack
      plugins: [
        new VueLoaderPlugin(),
        !isDev && new MiniCssExtractPlugin({
          filename: '[name].js.css',
        })
      ].filter(val => val),

      // RESOLVE https://webpack.js.org/configuration/resolve/
      resolve: {
        mainFields: ['module', 'main', 'browser'],
        modules: [resolve(__dirname, '../../node_modules'), 'node_modules'],
        symlinks: false
      },

      // RESOLVE LOADER https://webpack.js.org/configuration/resolve/#resolveloader
      resolveLoader: {
        modules: [resolve(__dirname, '../../node_modules'), 'node_modules'],
        symlinks: false
      }

    };
  }
}

module.exports = { watchOptions, errStatsHandler, configCreator };
