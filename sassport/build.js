/*****************************/
/*                           */
/*                           */
/*     ___  __ _ ___ ___     */
/*    / __|/ _` / __/ __|    */
/*    \__ \ (_| \__ \__ \    */
/*    |___/\__,_|___/___/    */
/*                           */
/*                           */
/*****************************/

const cssEsc = require("cssesc");
const postcss = require("postcss")([require("autoprefixer")]);
const sass = require("node-sass");
const sassUtils = require("./sass-utils");
const cssmin = require("cssmin");
const fs = require("fs");

function cssErr(message, bgcolor) {
  return `
  html { font-size: 1em; position: relative; }
  html:before {
    position: absolute;
    top: 0; left: 0;
    display: block;
    width: 100%;
    padding: 1rem;
    font-family: monospace;
    content: '${cssEsc(message)}';
    white-space: pre-wrap;
    background-color: ${bgcolor};
  }`;
}

const STYLESHEETS_DIR = "stylesheets";

function sassBuild(done = function() {}) {
  const SRC = `app.scss`;
  const OUT = `app.css`;
  sass.render(
    {
      file: SRC,
      outFile: OUT,
      includePaths: ["node_modules"],
      outputStyle: "nested",
      sourceMap: true,
      functions: {
        "require($path)": function(path) {
          return sassUtils.toSass(require(sassUtils.sassString(path)));
        },
        "pow($x, $y)": function(x, y) {
          return new sass.types.Number(Math.pow(x.getValue(), y.getValue()));
        }
      }
      // sourceMapEmbed: true,
      // sourceMapContents: true, // should this be true?
    },
    (err, data) => {
      if (err) {
        fs.writeFile(OUT, cssErr(err.formatted, "yellow"), "utf8", () =>
          done("app.css")
        );
      } else {
        postcss // http://api.postcss.org/global.html#processOptions
          .process(data.css, {
            from: SRC,
            to: OUT,
            map: data.map ? { inline: false, prev: data.map.toString() } : false
          })
          .then(data => {
            data
              .warnings()
              .forEach(warning => console.warn(warning.toString()));
            fs.writeFile(
              OUT,
              true ? data.css : cssmin(data.css),
              "utf8",
              () => {
                if (done) done("app.css");
              }
            );
            if (data.map) fs.writeFileSync(OUT + ".map", data.map);
          });
      }
    }
  );
}

sassBuild();
