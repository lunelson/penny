const fs = require('fs');
const { resolve, dirname, join } = require('path');

const requireResolve = require('resolve'); // for implementing require in put
const { markdown, markdownInline } = require('./misc-mdi.js');
const grayMatter = require('gray-matter');
const pug = require('pug');
const UrlPattern = require('url-pattern');

// const sassFns = require('./misc-sass.js');
const { $data, $pages } = require('./caches.js');

const write = require('write');
const readData = require('read-data');
const imageSize = require('image-size');

const _ = require('lodash');
const _dayjs = require('dayjs');
const _moment = require('moment');
const _dateFns = require('date-fns');

const _faker = require('faker');
const _chance = new (require('chance'))();
const _casual = require('casual');

module.exports = function(srcDir, options) {

  const { isDev } = options;

  return function(srcFile, depFiles) {

    function absolve(relPath) {
      return relPath[0] === '/' ?
        join(srcDir, relPath) :
        resolve(dirname(srcFile), relPath);
    }

    const boundFns = {
      // render a pug string
      render(str) {
        try {
          const compiler = pug.compile(str, this.$options);
          depFiles.push(...compiler.dependencies);
          return '\n'+compiler(this).trim();
        } catch(err) { throw Error(err); }
      },
      // render a pug file (dynamic includes!!!)
      include(relFile) {
        const absFile = absolve(relFile);
        try {
          const compiler = pug.compileFile(absFile, this.$options);
          depFiles.push(absFile, ...compiler.dependencies);
          return '\n'+compiler(this).trim();
        } catch(err) { throw Error(err); }
      },
      renderFile(relFile) {
        const absFile = absolve(relFile);
        try {
          const compiler = pug.compileFile(absFile, this.$options);
          depFiles.push(absFile, ...compiler.dependencies);
          return '\n'+compiler(this).trim();
        } catch(err) { throw Error(err); }
      },
    };

    const locals = {
      $env: isDev ? 'development':'production',
      // data sources
      $data,
      get $pages() { return _.values($pages); },
      // data generation
      _faker,
      _chance,
      _casual,
      // data manipulation
      _,
      _dayjs,
      _moment,
      _dateFns,
      // utilities
      // _depFiles,
      dump(value) { return JSON.stringify(value, null, 2); },
      matchURL(obj, pattern) {
        function doMatch(obj) {
          const result = new UrlPattern(`${pattern}(.html)`).match(obj.pathname);
          return result ? Object.assign(obj, result) : result;
        }
        return Array.isArray(obj) ? _.compact(obj.map(doMatch)) : doMatch(obj);
      },

      markdown(str) { return '\n'+markdown(str).trim(); },
      markdownInline(str) { return '\n'+markdownInline(str).trim(); },
      markdownFile(relFile){
        const absFile = absolve(relFile);
        const { content } = grayMatter(fs.readFileSync(absFile, 'utf8'));
        depFiles.push(absFile);
        return '\n'+markdown(content).trim();
      },
      writeFile(relFile, content) {
        const absFile = absolve(relFile);
        return write.sync(absFile, content);
      },
      writeFileIf(relFile, content) {
        const absFile = absolve(relFile);
        if (fs.existsSync(absFile)) return false;
        return write.sync(absFile, content);
      },
      imageSize(relImg) {
        const absImg = absolve(relImg);
        depFiles.push(absImg);
        return imageSize(absImg);
      },
      grayMatter(relFile) {
        const absFile = absolve(relFile);
        depFiles.push(absFile);
        return grayMatter.read(absFile);
      },
      readData(relFile) {
        const absFile = absolve(relFile);
        depFiles.push(absFile);
        return readData.sync(absFile);
      },
      require(relModule) {
        const srcModule = requireResolve.sync(relModule, { basedir: srcDir });
        depFiles.push(srcModule);
        delete require.cache[srcModule];
        return require(srcModule);
      },
    };

    Object.keys(boundFns).forEach((fn) => {
      locals[fn] = boundFns[fn].bind(locals);
    });

    return locals;
  };
};

// module.exports = function(srcDir, srcFile) {
// function absolve(relPath) {
//   return relPath[0] === '/' ?
//     join(srcDir, relPath) :
//     resolve(dirname(srcFile), relPath);
// }
//   const dependencies = [];
//   return {
//     dependencies,
//     get instance() {
//       dependencies.length = 0;
//       return {

//         // environment
//         $env: isDev ? 'development':'production',

//         // data sources
//         $data,
//         get $pages() { return _.values($pages); },

//         // data generation
//         _faker,
//         _chance,
//         _casual,

//         // data manipulation
//         _,
//         _dayjs,
//         _moment,
//         _dateFns,

//         // utilities
//         dump(value) { return JSON.stringify(value, null, 2); },
//         markdown(str) { return '\n'+markdown(str).trim(); },
//         markdownInline(str) { return '\n'+markdownInline(str).trim(); },
//         markdownFile(relFile){
//           const absFile = absolve(relFile);
//           const { content } = grayMatter(fs.readFileSync(absFile, 'utf8'));
//           this.depFiles.push(absFile);
//           return '\n'+markdown(content).trim();
//         },
//         pug(str) {
//           try {
//             const compiler = pug.compile(str, this.$options);
//             this.depFiles.push(...compiler.dependencies);
//             return '\n'+compiler(this).trim();
//           } catch(err) { throw Error(err); }
//         },
//         pugFile(relFile) {
//           const absFile = absolve(relFile);
//           try {
//             const compiler = pug.compileFile(absFile, this.$options);
//             this.depFiles.push(absFile, ...compiler.dependencies);
//             return '\n'+compiler(this).trim();
//           } catch(err) { throw Error(err); }
//         },
//         writeFile(relFile, content) {
//           const absFile = absolve(relFile);
//           return write.sync(absFile, content);
//         },
//         writeFileIf(relFile, content) {
//           const absFile = absolve(relFile);
//           if (fs.existsSync(absFile)) return false;
//           return write.sync(absFile, content);
//         },
//         imageSize(relImg) {
//           const absImg = absolve(relImg);
//           this.depFiles.push(absImg);
//           return imageSize(absImg);
//         },
//         grayMatter(relFile) {
//           const absFile = absolve(relFile);
//           this.depFiles.push(absFile);
//           return grayMatter.read(absFile);
//         },
//         readData(relFile) {
//           const absFile = absolve(relFile);
//           this.depFiles.push(absFile);
//           return readData.sync(absFile);
//         },
//         require(relModule) {
//           const srcModule = requireResolve.sync(relModule, { basedir: srcDir });
//           this.depFiles.push(srcModule);
//           delete require.cache[srcModule];
//           return require(srcModule);
//         },
//       };
//     }
//   };
// };

// module.exports = function(srcDir, options) {

//   function absolve(relPath) {
//     return relPath[0] === '/' ?
//       join(srcDir, relPath) :
//       resolve(dirname(this.srcFile), relPath);
//   }

//   class PugFns {
//     constructor(srcFile) {
//       this.srcFile = srcFile;
//       this.depFiles = [];
//     }

//     dump(value) { return JSON.stringify(value, null, 2); }

//     markdown(str){ return '\n'+markdown(str).trim(); }

//     markdownInline(str){ return '\n'+markdownInline(str).trim(); }

//     markdownFile(relFile){
//       const absFile = absolve.call(this, relFile);
//       const { content } = grayMatter(fs.readFileSync(absFile, 'utf8'));
//       this.depFiles.push(absFile);
//       return '\n'+markdown(content).trim();
//     }

//     pug(str) {
//       try {
//         const compiler = pug.compile(str, this.$options);
//         this.depFiles.push(...compiler.dependencies);
//         return '\n'+compiler(this).trim();
//       } catch(err) { throw Error(err); }
//     }

//     pugFile(relFile) {
//       const absFile = absolve.call(this, relFile);
//       try {
//         const compiler = pug.compileFile(absFile, this.$options);
//         this.depFiles.push(absFile, ...compiler.dependencies);
//         return '\n'+compiler(this).trim();
//       } catch(err) { throw Error(err); }
//     }

//     writeFile(relFile, content) {
//       const absFile = absolve.call(this, relFile);
//       return write.sync(absFile, content);
//     }

//     writeFileIf(relFile, content) {
//       const absFile = absolve.call(this, relFile);
//       if (fs.existsSync(absFile)) return false;
//       return write.sync(absFile, content);
//     }

//     imageSize(relImg) {
//       const absImg = absolve.call(this, relImg);
//       this.depFiles.push(absImg);
//       return imageSize(absImg);
//     }

//     grayMatter(relFile) {
//       const absFile = absolve.call(this, relFile);
//       this.depFiles.push(absFile);
//       return grayMatter.read(absFile);
//     }

//     readData(relFile) {
//       const absFile = absolve.call(this, relFile);
//       this.depFiles.push(absFile);
//       return readData.sync(absFile);
//     }

//     require(relModule) {
//       const srcModule = requireResolve.sync(relModule, { basedir: srcDir });
//       this.depFiles.push(srcModule);
//       delete require.cache[srcModule];
//       return require(srcModule);
//     }
//   }

//   _.assign(PugFns, {
//     // data manipulation
//     _faker,
//     _chance,
//     _casual,

//     // data manipulation
//     _,
//     _dayjs,
//     _moment,
//     _dateFns,

//     // node core
//     // _fs:fs,
//     // _path:path,

//     // filters
//     markdown: markdown,
//     markdownInline: markdownInline,
//   });

//   return PugFns;
// };
