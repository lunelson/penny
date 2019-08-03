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

const path = require('path');

const VueLoaderPlugin = require('vue-loader/lib/plugin');
const VueTemplateCompiler = require('vue-template-compiler');
const babelPresetEnv = require('@babel/preset-env');
const babelPluginORS = require('@babel/plugin-proposal-object-rest-spread');
const babelPluginDynImport = require('@babel/plugin-syntax-dynamic-import');
const babelResolver = require('babel-plugin-module-resolver');

// exports.watchOptions = [
//   {
//     aggregateTimeout: 200,
//     ignored: /node_modules/,
//   },
//   function errStatsHandler(err, stats) {
//     if (err) {
//       console.error(err.stack || err);
//       if (err.details) {
//         console.error(err.details);
//       }
//       return;
//     }
//     if (stats) {
//       const info = stats.toJson();
//       if (stats.hasErrors()) info.errors.forEach(err => console.error(err.toString()));
//       if (stats.hasWarnings()) info.warnings.forEach(err => console.warn(err.toString()));
//     }
//   },
// ];

exports.entryConfigurator = function(options) {
  return function(entryFile) {
    const { isDev, isBuild, srcDir, pubDir, outDir, baseUrl } = options;
    // const relPath = path.dirname(relFile);

    return {
      // CORE
      context: pubDir,
      entry: entryFile,
      output: {
        filename: path.basename(entryFile),
        path: path.join(outDir, path.dirname(entryFile)),
        publicPath: `${path.resolve('/', baseUrl, path.dirname(entryFile))}/`,
      },

      // OPTIONS
      mode: isDev ? 'development' : 'production',
      devtool: isDev ? 'source-map' : false,
      performance: { hints: isDev ? false : 'warning' },

      // MODULE RULES & LOADERS
      module: {
        // NB: noParse option is interesting
        // noParse: (content) => /jquery|lodash/.test(content),
        rules: configureRules(entryFile, options),
      },

      // PLUGINS
      // to consider:
      // - CompressionWebpackPlugin || ZopfliWebpackPlugin
      // - DotEnv https://github.com/mrsteele/dotenv-webpack
      // plugins: [
      //   new VueLoaderPlugin(),
      //   !isDev &&
      //     new MiniCssExtractPlugin({
      //       filename: '[name].js.css',
      //     }),
      // ].filter(val => val),

      plugins: [new VueLoaderPlugin()],

      // RESOLVE MODULES https://webpack.js.org/configuration/resolve/
      resolve: {
        mainFields: ['module', 'main', 'browser'],
        modules: [path.resolve(__dirname, '../node_modules'), 'node_modules'],
      },

      // RESOLVE LOADERS https://webpack.js.org/configuration/resolve/#resolveloader
      resolveLoader: {
        modules: [path.resolve(__dirname, '../node_modules'), 'node_modules'],
      },
    };
  };
};

function configureRules(srcFile, options) {
  const { srcDir, pubDir, isDev, browsers, babelInclude = [] } = options;

  const configNodeSass = require('./config-sass.js')(srcFile, options);
  const configPug = require('./config-pug.js')(srcFile, options);

  let { babelExclude } = options;
  babelExclude =
    babelExclude != undefined
      ? babelExclude
      : function(file) {
          return (
            /(node_modules|bower_components)/.test(file) &&
            !/\.vue\.js/.test(file) &&
            !babelInclude
              .map(
                moduleName =>
                  new RegExp(
                    'node_modules' +
                      (path.sep == '\\' ? '\\\\' : path.sep) +
                      moduleName,
                  ),
              )
              .some(regex => regex.test(file))
          );
        };

  //   __ _ _
  //  / _(_) |
  // | |_ _| | ___
  // |  _| | |/ _ \
  // | | | | |  __/
  // |_| |_|_|\___|

  const fileRule = {
    test: /\.(png|jpg|jpeg|gif|webp)$/i,
    loader: 'file-loader',
    options: {
      emitFile: false,
      name: '[name].[ext]',
    },
  };

  //  _ __  _   _  __ _
  // | '_ \| | | |/ _` |
  // | |_) | |_| | (_| |
  // | .__/ \__,_|\__, |
  // | |           __/ |
  // |_|          |___/

  const pugLoading = [
    {
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
      },
    },
  ];

  const pugRule = {
    test: /\.pug$/,
    oneOf: [
      // this applies to `<template lang="pug">` in Vue components
      {
        resourceQuery: /^\?vue/,
        use: [...pugLoading],
      },
      // this applies to pug imports inside JavaScript
      {
        use: ['raw-loader', ...pugLoading],
      },
    ],
  };

  // __   ___   _  ___
  // \ \ / / | | |/ _ \
  //  \ V /| |_| |  __/
  //   \_/  \__,_|\___|

  const vueRule = {
    test: /\.vue$/,
    loader: 'vue-loader',
    options: {
      hotReload: false,
      optimizeSSR: false,
      compiler: VueTemplateCompiler,
    },
  };

  //    _
  //   (_)
  //    _ ___
  //   | / __|
  //   | \__ \
  //   | |___/
  //  _/ |
  // |__/

  // this will apply to both plain `.js` files
  // AND `<script>` blocks in `.vue` files

  const jsRule = {
    test: /\.js$/,
    // based on this https://github.com/webpack/webpack/issues/2031#issuecomment-317589620
    // ...and on README from vue-loader
    exclude: babelExclude,
    loader: 'babel-loader',
    options: {
      babelrc: false,
      sourceMap: isDev,
      cacheDirectory: isDev,
      presets: [
        [
          babelPresetEnv,
          {
            modules: false,
            targets: { browsers },
            ignoreBrowserslistConfig: true, //?
            useBuiltIns: 'usage',
            shippedProposals: true,
          },
        ],
      ],
      plugins: [
        babelPluginDynImport,
        [
          babelPluginORS,
          {
            useBuiltIns: true,
          },
        ],
        [
          babelResolver,
          {
            root: srcDir,
            // cwd: process.cwd(), // see https://github.com/tleunen/babel-plugin-module-resolver/blob/master/DOCS.md#cwd
          },
        ],
      ].filter(val => val),
    },
  };

  //                     __
  //                    / /
  //   ___ ___ ___     / /   ___  ___ ___ ___
  //  / __/ __/ __|   / /   / __|/ __/ __/ __|
  // | (__\__ \__ \  / /    \__ \ (__\__ \__ \
  //  \___|___/___/ /_/     |___/\___|___/___/

  // const styleLoader = isDev ?
  //   { loader: 'vue-style-loader', options: { hmr: false, sourceMap: isDev, } } :
  //   { loader: MiniCssExtractPlugin.loader };

  const styleLoader = {
    loader: 'vue-style-loader',
    options: { hmr: false, sourceMap: isDev },
  };

  const postCSSLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: isDev,
      plugins: [require('autoprefixer')({ browsers, grid: true })],
    },
  };

  const cssRule = {
    // this will apply to both plain `.css` files
    // AND `<style>` blocks in `.vue` files
    test: /\.css$/,
    use: [
      styleLoader,
      {
        loader: 'css-loader',
        options: {
          sourceMap: isDev,
          importLoaders: 1,
          modules: false, // TODO: make this option controllable from penny (css-modules)
        },
      },
      postCSSLoader,
    ],
  };

  const scssRule = {
    test: /\.scss$/,
    use: [
      styleLoader,
      {
        loader: 'css-loader',
        options: {
          sourceMap: isDev,
          importLoaders: 2,
          modules: false, // TODO: make this option controllable from penny (css-modules)
        },
      },
      postCSSLoader,
      {
        loader: 'sass-loader',
        options: {
          sourceMap: isDev,
          ...configNodeSass(srcFile),
          // sourceMap: false // ?
        },
      },
    ],
  };

  return [fileRule, pugRule, vueRule, jsRule, cssRule, scssRule];
}
