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


// bulit-in
const { sep } = require('path');

// webpack plugins
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// babel plugins
const babelPresetEnv = require('@babel/preset-env');
const babelPluginORS = require('@babel/plugin-proposal-object-rest-spread');
const babelResolver = require('babel-plugin-module-resolver');

module.exports = function(srcDir, pubDir, options) {

  // local configuration
  const configureNodeSass = require('./config-node-sass.js')(srcDir, options);
  const configurePug = require('./config-pug.js')(srcDir, options);

  const { isDev, browsers, babelInclude = [] } = options;
  let { babelExclude } = options;
  babelExclude = babelExclude!=undefined ? babelExclude : function(file) {
    return /(node_modules|bower_components)/.test(file) &&
    !/\.vue\.js/.test(file) &&
    !babelInclude
      .map(moduleName => new RegExp('node_modules' + (sep=='\\'?'\\\\':sep) + moduleName))
      .some(regex => regex.test(file));
  };

  return function(srcFile) {

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
              targets: { browsers, },
              ignoreBrowserslistConfig: true, //?
              useBuiltIns: 'usage',
              shippedProposals: true,
            },
          ],
        ],
        plugins: [
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

    const styleLoader = { loader: 'vue-style-loader', options: { hmr: false, sourceMap: isDev, } };

    const postCSSLoader = { loader: 'postcss-loader', options: {
      sourceMap: isDev,
      plugins: [ require('autoprefixer')({ browsers, grid: true }) ]
    }, };

    const cssRule = {
      // this will apply to both plain `.css` files
      // AND `<style>` blocks in `.vue` files
      test: /\.css$/,
      use: [ styleLoader,
        {
          loader: 'css-loader',
          options: {
            sourceMap: isDev,
            importLoaders: 1,
            modules: false, // TODO: make this option controllable from penny (css-modules)
          },
        },
        postCSSLoader
      ],
    };

    const scssRule = {
      test: /\.scss$/,
      use: [ styleLoader,
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
            ...configureNodeSass(srcFile),
            // sourceMap: false // ?
          },
        },
      ],
    };

    return [
      fileRule,
      pugRule,
      vueRule,
      jsRule,
      cssRule,
      scssRule,
    ];
  };

};