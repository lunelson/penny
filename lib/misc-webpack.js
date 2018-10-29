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

const { join, resolve, dirname, basename, relative, sep } = require('path');
const babelPresetEnv = require('@babel/preset-env');
const babelPluginORS = require('@babel/plugin-proposal-object-rest-spread');
const babelResolver = require('babel-plugin-module-resolver');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function errStatsHandler(err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) { console.error(err.details); }
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

  const configureNodeSass = require('./config-node-sass.js')(srcDir, options);

  const {
    isDev,
    browsers,
    babelIncludes = []
  } = options;

  var pathSep = sep;
  if (pathSep == '\\') pathSep = '\\\\';
  var babelIncludeRegexes = babelIncludes.map(function (name) {
    return new RegExp('node_modules' + pathSep + name);
  });

  const cssLoading = [
    isDev ? {
      loader: 'vue-style-loader',
      options: {
        hmr: false,
        sourcemap: true
      }
    } :
      MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        sourceMap: isDev
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: isDev
      }
    },
  ];

  const pugLoading = [{
    loader: 'pug-plain-loader',
    options: {
      basedir: pubDir,
      cache: false,
      debug: false,
      doctype: 'html',
      globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
      name: false,
      pretty: isDev,
      self: false,
    }
  }];

  return function configureEntry(relFile) {
    const srcFile = join(pubDir, relFile);
    // const sassFns = sassFunctions(pubDir, srcFile);
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
      devtool: isDev ? 'eval-source-map' : false,
      performance: {
        hints: isDev ? false : 'warning',
      },

      // MODULES / LOADERS
      module: {
        rules: [{
          test: /\.(png|jpg|jpeg|gif|webp)$/i,
          loader: 'file-loader',
          options: {
            emitFile: false,
            name: '[path][name].[ext]'
          }
        },

        {
          test: /\.pug$/,
          oneOf: [
            // this applies to `<template lang="pug">` in Vue components
            {
              resourceQuery: /^\?vue/,
              use: [...pugLoading]
            },
            // this applies to pug imports inside JavaScript
            {
              use: ['raw-loader', ...pugLoading]
            }
          ]
        },

        // {
        //   test: /\.pug$/,
        //   loader: 'pug-plain-loader',
        //   options: {
        //     basedir: pubDir,
        //     cache: false,
        //     debug: false,
        //     doctype: 'html',
        //     globals: false, // see this issue https://github.com/pugjs/pug/issues/1773
        //     name: false,
        //     pretty: isDev,
        //     self: false,
        //   }
        // },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            hotReload: false,
            optimizeSSR: false,
          }
        },
        // this will apply to both plain `.js` files
        // AND `<script>` blocks in `.vue` files
        {
          test: /\.js$/,
          // based on this https://github.com/webpack/webpack/issues/2031#issuecomment-317589620
          // ...and on README from vue-loader
          exclude: file => (
            /(node_modules|bower_components)/.test(file) &&
              !babelIncludeRegexes.some(regex => regex.test(file)) &&
              !/\.vue\.js/.test(file)
          ),
          loader: 'babel-loader',
          options: {
            babelrc: false,
            sourceMap: isDev,
            cacheDirectory: isDev,
            presets: [
              [babelPresetEnv, {
                modules: false,
                targets: {
                  browsers
                },
                ignoreBrowserslistConfig: true, //?
                useBuiltIns: 'usage',
                shippedProposals: true
              }]
            ],
            plugins: [
              [babelPluginORS, {
                useBuiltIns: true
              }],
              [babelResolver, {
                root: srcDir,
                // cwd: process.cwd(), // see https://github.com/tleunen/babel-plugin-module-resolver/blob/master/DOCS.md#cwd
              }],
            ].filter(val => val)
          }
        },
        // this will apply to both plain `.css` files
        // AND `<style>` blocks in `.vue` files
        {
          test: /\.css$/,
          use: cssLoading
        },
        {
          test: /\.scss$/,
          use: [
            ...cssLoading,
            {
              loader: 'sass-loader',
              options: {
                ...configureNodeSass(srcFile),
                // sourceMap: false // ?
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
        modules: [resolve(__dirname, '../node_modules'), 'node_modules'],
        // symlinks: false
      },

      // RESOLVE LOADER https://webpack.js.org/configuration/resolve/#resolveloader
      resolveLoader: {
        modules: [resolve(__dirname, '../node_modules'), 'node_modules'],
        // symlinks: false
      }

    };
  };
}

module.exports = {
  watchOptions,
  errStatsHandler,
  configCreator
};
