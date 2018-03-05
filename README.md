<img src="logo.svg" width="320">

# penny <br> a zero-config on-the-fly-compiling dev server <br>...which also builds and is configurable

[![npm published v](https://img.shields.io/npm/v/@lunelson/penny.svg)]()
[![dependencies](https://david-dm.org/lunelson/penny.svg)]()
[![node supported v](https://img.shields.io/node/v/@lunelson/penny.svg)]()


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
