### ground rules

* https will be enabled if a .key and .crt file are found in base dir
* additional search directories can be configured per src type in .penguinrc
* data can be added by giving a `data` entry point in .penguinrc
* priority is given to existing files over source files
  - .css will be served over .scss for same basename
  - .html will be served over .pug for same basename
* a minimum of processing takes place on all source files
  - SCSS: sass, postcss, uglify [if production]
  - CSS: postcss, uglify [if production]
  - JS: rollup, babel, uglify [if production]
  - PUG: pug, uglify [if production]
  - HTML: uglify [if production]