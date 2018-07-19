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
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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

function configCreator(srcDir, outDir=null, isDev=true) {

  return function configureEntry(relFile) {
    const srcFile = path.resolve(srcDir, relFile);
    const outFile = outDir?path.resolve(outDir, relFile):srcFile;
    return {

      //
      // CORE
      //
      context: srcDir,
      entry: srcFile,
      output: {
        path: path.dirname(outFile),
        filename: path.basename(outFile),
        publicPath: `/${path.dirname(path.relative(srcDir, srcFile))}/`
      },

      //
      // OPTIONS
      //
      // https://webpack.js.org/concepts/mode/#usage
      mode: isDev?'development':'production',
      // TODO: make sure .js and .map files are searched for in memoryFs first
      devtool: isDev?'eval-source-map':false,
      // TODO: make sure penny's node_modules dir is prioritized here
      resolveLoader: { modules: [ 'node_modules' ], },
      performance: { hints: isDev?false:'warning', },

      //
      // LOADERS, PLUGINS
      //
      // module: {
      //   rules: [
      //     {
      //       test: /\.pug$/,
      //       loader: 'pug-plain-loader',
      //       options: {
      //         basedir: srcDir,
      //       }
      //     },
      //     {
      //       test: /\.vue$/,
      //       loader: 'vue-loader',
      //       options: {
      //         hotReload: false,
      //       }
      //     },
      //     // this will apply to both plain `.js` files
      //     // AND `<script>` blocks in `.vue` files
      //     {
      //       test: /\.js$/,
      //       loader: 'babel-loader',
      //       options: {
      //         presets: ['env'] // fill ths out
      //       }
      //     },
      //     // this will apply to both plain `.css` files
      //     // AND `<style>` blocks in `.vue` files
      //     {
      //       test: /\.css$/,
      //       use: [
      //         process.env.NODE_ENV !== 'production' ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
      //         'css-loader',
      //         'postcss-loader',
      //       ]
      //     },
      //     {
      //       test: /\.scss$/,
      //       use: [
      //         {
      //           loader: "vue-style-loader",
      //           options: { hmr: false }
      //         },
      //         {
      //           loader: "css-loader"
      //         },
      //         {
      //           loader: "postcss-loader"
      //         },
      //         {
      //           loader: "sass-loader",
      //           options: {
      //             includePaths: ["absolute/path/a", "absolute/path/b"]
      //           }
      //         }
      //       ]
      //     }
      //   ]
      // },
      // plugins: [
      //   // add this to make vue work
      //   new VueLoaderPlugin(),
      //   // add this only if production
      //   new MiniCssExtractPlugin({
      //     filename: "[name].js.css",
      //   })
      // ]

    };
  }
}

module.exports = { watchOptions, errStatsHandler, configCreator };
