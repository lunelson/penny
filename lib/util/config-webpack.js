const { resolve, dirname, basename, relative } = require('path');

const webpack = require('webpack');
const webpackUglify = require('uglifyjs-webpack-plugin');
const webpackLodash = require('lodash-webpack-plugin');

const eslintLoader = require('eslint-loader');
const babelLoader = require('babel-loader');

const babelPresetEnv = require('@babel/preset-env');
const babelPluginORS = require('@babel/plugin-proposal-object-rest-spread');
const babelHelpers = require('@babel/plugin-external-helpers');

const babelResolver = require('babel-plugin-module-resolver');
const babelLodash = require('babel-plugin-lodash');

const configureEslint = require('./config-eslint');

/*
  QUESTIONS

  - do I need to specify sourcemaps in loaders
  - can I put in a banner that does 'use-strict'?? do I need to??

*/

module.exports = function(baseDir, isDev, options) {

  const { browsersList: browsers, linting } = options;
  const procDir = process.cwd();

  return function(srcFile) {
    const reqFile = srcFile; // .js -> .js
    const relDir = relative(baseDir, dirname(reqFile));
    return {

      // ENTRY AND CONTEXT
      // https://webpack.js.org/configuration/entry-context/
      entry: srcFile, // node-absolute input file
      context: baseDir,

      // OUTPUT
      // https://webpack.js.org/configuration/output/
      output: {
        path: dirname(reqFile), // node-absolute output dir
        filename: basename(reqFile), // output file, relative to path
        publicPath: `/${relative(baseDir, dirname(reqFile))}/`, // server-absolute output dir
        pathinfo: isDev,
      },

      // DEVTOOL
      // https://webpack.js.org/configuration/devtool/
      // must be inline; balancing speed and usefulness
      devtool: isDev ? 'inline-cheap-module-source-map' : false,

      // MODULE
      // https://webpack.js.org/configuration/module/
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              babelrc: false,
              exclude: '**/node_modules/**',
              sourceMap: isDev,
              cacheDirectory: isDev,
              presets: [
                [babelPresetEnv, {
                  // debug: isDev,
                  modules: false,
                  targets: { browsers },
                  useBuiltIns: 'usage',
                  shippedProposals: true
                }]
              ],
              plugins: [
                // babelHelpers,
                [babelPluginORS, { useBuiltIns: true }],
                [babelResolver, { root: baseDir }],
                // [babelResolver, { alias: { '~': relDir.length?`./${relDir}/`:'./' } }],
                !isDev && babelLodash,
              ].filter(val => val)
            }
          },
          {
            enforce: 'pre',
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'eslint-loader',
            options: {
              // see https://eslint.org/docs/developer-guide/nodejs-api#cliengine
              fix: true,
              cache: isDev,
              formatter: 'codeframe',
              useEslintrc: false,
              throwOnError: true,
              throwOnWarning: true,
              baseConfig: configureEslint(options.eslintConfig || {}),
            }
          },
        ]
      },


      // PLUGINS
      // to consider:
      // - CompressionWebpackPlugin || ZopfliWebpackPlugin
      // - NpmInstallWebpackPlugin (automatic installs??)
      // - I18nWebpackPlugin (translated bundles?? )
      // - DotEnv https://github.com/mrsteele/dotenv-webpack
      plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.EnvironmentPlugin({ NODE_ENV: 'development', DEBUG: false }), // defaults
        // new webpack.DefinePlugin({
        //   'process.env.NODE_ENV': JSON.stringify(isDev?'development':'production'),
        //   'NODE_ENV': JSON.stringify(isDev?'development':'production'),
        //   'ENV': JSON.stringify(isDev?'development':'production'),
        // }),
        !isDev && new webpack.optimize.ModuleConcatenationPlugin(), // scope hoisting
        !isDev && new webpackLodash(), // lodash module replacement
        !isDev && new webpackUglify(), // uglifyyyy
      ].filter(val => val),


      // RESOLVE
      // https://webpack.js.org/configuration/resolve/
      resolve: {
        mainFields: ['module', 'main', 'browser'],
        // modules: [procDir, 'node_modules'], // ?? allow local modules to work? e.g. lodash
      },

      // RESOLVE LOADER
      // https://webpack.js.org/configuration/resolve/#resolveloader
      resolveLoader: {
        modules: [resolve(__dirname, '../../node_modules'), 'node_modules'],
      }
    };
  };
};
