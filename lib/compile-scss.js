// export
module.exports = function(srcDir, options) {
  const { isDev, isBuild } = options;
  return class ScssCompiler {
    constructor(srcFile) { this.srcFile = srcFile; this.depFiles = []; }
    render() {
    }
    depcheck(absFile){
      if (~this.depFiles.indexOf(absFile)) this.render();
    }
  }
}



// const { streamCache } = require('./cache');

// function sliceExt(str) {
//   const extIndex = str.lastIndexOf('.');
//   return ~extIndex ? str.slice(0, extIndex) : str;
// }

// module.exports = class ScssCompiler {
//   constructor(absFile, pennyOptions) {
//     this.file = absFile;
//     this.options = pennyOptions; // TODO: merge against defaults
//     this.stats = null;
//   }
//   render() {
//     const { isDev, isBuild, browsers } = this.options;
//     const postCSS = PostCSS([autoPrefixer({ browsers })].concat(isDev?[]:[postCSSClean({})]));
//     const file = this.file, outFile = sliceExt(this.file)+'.css';
//     streamCache[this.file] = new Promise((resolve, reject) => {
//       Sass.render({
//           file, outFile,
//           includePaths: ['node_modules', '.', path.dirname(this.file)], // TODO: get real reasonable paths here
//           outputStyle: 'nested',
//           sourceMap: isDev,
//           functions: sassFns(this.file)
//         }, (err, data) => {
//           if (err) reject(err);
//           this.stats = data.stats; // NOTE: updating internal stats
//           resolve(data);
//         }
//       );
//     }).then(data => postCSS.process(data.css, {
//       from: file, to: outFile,
//       map: data.map ? { inline: true, prev: data.map.toString() } : false
//     }))

//       //
//       // RETURN STREAM HERE !!!
//       //

//       .then(data => {
//         return streamify(data.css);
//       }).catch(err => {
//         if (isBuild) throw Error(err);
//         return streamify(cssErr(err.formatted, '#F2E6EA'));
//       });
//     return true;
//   }
//   checkdeps(filePath) {
//     if (!~this.stats.includedFiles.indexOf(filePath)) return false;
//     return this.render();
//   }
// }

// class PugCompiler {
//   constructor(absFile, pennyOptions) {
//     this.file = absFile;
//     this.options = pennyOptions; // TODO: merge pennyOptions with pugOptions, incl. filters
//     this.stats = null;
//   }
//   compile() {
//     const { isDev, isBuild, browsers } = this.options;
//     this.getRenderer = Promise.resolve(Pug.compile(this.file, this.options));
//   }
//   render() {
//     streamCache[this.file] = this.getRenderer.then(renderer => {

//     });
//     new Promise((resolve, reject) => {
//       const result = this.getRenderer(pugLocals);
//       resolve(result)
//     })
//     // const file = this.file, outFile = sliceExt(this.file)+'.css';
//     streamCache[this.file] = new Promise((resolve, reject) => {
//       this.getRenderer = Pug.compile(this.file, pugOptions);

//     })

//       //
//       // RETURN STREAM HERE !!!
//       //

//       .then(data => {
//         return streamify(data.css);
//       }).catch(err => {
//         if (isBuild) throw Error(err);
//         return streamify(cssErr(err.formatted, '#F2E6EA'));
//       });
//     return true;

//   }
//   checkdeps(filePath) {
//     if (!~this.getRenderer.dependencies.indexOf(filePath)) return false;
//     return this.compile();
//   }
// }
