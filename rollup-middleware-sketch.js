"use strict";

const { join, relative, resolve } = require("path");
const Rollup = require("rollup");

import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

module.exports = ({
  rollup = {},
  generate = {},
  prefix = ".",
  grep = /\.js$/
}) => {
  const caches = {};
  return (req, res, next = () => {
    if (!req.path.match(grep)) return next();

    const cache = caches[req.path];

    const inputOptions = {
      input: join(prefix, req.path),
      external: [],
      plugins: [
        resolve(),
        commonjs(),
        babel(),
        replace({
          ENV: JSON.stringify(process.env.NODE_ENV || "development")
        })
      ],
      // onwarn, // ?
      cache
    };

    const outputOptions = {
      format: "es",
      sourcemap: "inline"
    };

    Rollup.rollup(inputOptions).then(
      bundle => {
        caches[req.path] = bundle;
        res.setHeader("Content-Type", "text/javascript");
        res.end(bundle.generate(outputOptions).code);
      },
      err => {
        if (err.code === "PARSE_ERROR") {
          console.error(
            "%s:%d:%d: %s",
            relative(resolve(process.cwd(), prefix), err.loc.file),
            err.loc.line,
            err.loc.column,
            err.message
          );
          console.error();
          console.error(err.frame);
          console.error();
          res.writeHead(500);
          res.end();
        } else if (err.code === "UNRESOLVED_ENTRY") {
          // Pass 404s on to the next middleware
          next();
        } else {
          next(err);
        }
      }
    );
  };
};
