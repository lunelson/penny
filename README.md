<img src="logo.svg" width="320">

# penny <br> a zero-config on-the-fly-compiling dev server <br>...which also builds and is configurable

[![npm published v](https://img.shields.io/npm/v/@lunelson/penny.svg)]()
[![dependencies](https://david-dm.org/lunelson/penny.svg)]()
[![node supported v](https://img.shields.io/node/v/@lunelson/penny.svg)]()

### philosophy

- original idea was a local 'pen' (hence the name) server application for doing HTML/CSS/JS in any format with modern features
- also inspired by Harp.js idea, which got me in to jade/pug but eventually stopped maintainance
- but the powerful idea is something like "lazy static site generation": that is, in development you don't need to build out any static files, let alone continually build *all* the files (like most SSG setups do);
- but rather in development, where you spend most of your time, where you make constant changes and need to see constant updates, you build on-demand and on-the-fly via middleware, via browser request. This means you build *only the resources currently being loaded in browsers*.
- then later for production you build out all the files, with optional additional post-processing for some optimization.

### CLI API

```sh
npm i @lunelson/penny
```
```sh
penny serve [source]
```
```sh
penny build [source] [output]
```
### options

- `browsers`: (see notes on declination of config file paths)
- `include`: [same as jekyll option]
- `exclude`: [same as jekyll option]
- `keepFiles`: [same as jekyll 'keep_files' option]
- `baseUrl`: [same as jekyll option]
- `subRoot`: sub-folder of [source], for alt structure; caveat: import/include is source-root-relative!
- `markdownItOptions`
- `markdownItPlugins()`
- `posthtmlPlugins()`
- `postcssPlugins()`

#### flags added internally

- `isDev`: whether we are in dev mode
- `isBuild`: whether this is a build (as opposed to serve)

### technical basis

- browsersync, connect
- pug, sass (node-sass, libsass), webpack
- postcss, posthtml

### added functionality

- templates
  - utility and helper libs in locals
- stylesheets
  - custom functions to node-sass
  - custom importer to node-sass
- javascripts
  - webpack-loaders

### dir structure and path references

- basic idea is to serve source *as* output; all non-src files pass through
- src files with .min.[ext] name pattern will be served without being processed
- alternative is to provide a 'public' subdirectory; caveat: src file references are still source-root-relative
- underscored files and directories are 'hidden' from being served or built (these are for import-/include-only files)
- markdown rendering is also supported, with additional rules
  - any file without a 'layout' key in its front-matter will not be served or built
  - any file with 'publish: false' in its front-matter will be served, but not built
- `import`, `@import`, `include` and helper function references in all file formats treat `/folder/file` references as source-root-relative

### faq

- file name conflicts ?
  - order is internally spec'd



```sh
npm install -g @lunelson/penny
```

Penny is not another bundler. It is an on-request in-memory-compiling live-reloading server for development, and a static-site builder for production. It avoids the pain of build-tool configuration, and the wasted time of full-site rebuilds.

* Pug.js, Libsass (via node-sass) and Babel/Webpack as view-engines
* Advanced helper functions incl. data-loading in templates and stylesheets
* Sourcemaps, file-watching and live-reloading in development; minification and purging in production



```sh
# given this structure...
# .
# ├── out
# └── src
#     ├── index.pug
#     ├── main.js
#     └── main.scss

# run this to serve /src live on localhost:3000

penny serve src

# ...or run this to build from /src to /out...

penny build src out

# ...and get this structure
# .
# ├── out
#     ├── index.html
#     ├── main.js (es5)
#     └── main.css
# └── src
#     ├── index.pug
#     ├── main.js (es6)
#     └── main.scss
