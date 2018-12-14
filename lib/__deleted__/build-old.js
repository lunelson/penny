/////////////////////////////////////////////
///////////////// OLD BUILD /////////////////
/////////////////////////////////////////////

Promise.all([ dataWatching, pageWatching, srcWatching, jsWatching ])
    .then((watchers) => {

      allWatchers = watchers;

      // if ($data._errors.size) { throw new Error('error in $data'); }
      // if ($pages._errors.size) { throw new Error('error in $pages'); }

      return rrdir(srcDir).then(files => {

        const relFiles = files.map(file => relative(pubDir, file));

        // sort the files by type

        const relFileTypes = mm(relFiles, ['**/*','!**/_*/**/*.*', '!**/_*.*', '!**/node_modules/**'])
          .filter(file => junk.not(basename(file)))
          .reduce((obj, file) => {
            const ext = extname(file);
            const type = ~srcExts.indexOf(ext) ?
              'src' :
              ext == '.js' ?
                'js' :
                'other';
            obj[type] = obj[type] || [];
            obj[type].push(file);
            return obj;
          }, {});

        // clear the destination directory, except for keepFiles

        del.sync([join(outDir, '**'), `!${outDir}`].concat(options.keepFiles.map(fp => `!${fp}`)));

        // copy all other files

        relFileTypes.other.forEach(relFile => cp.sync(join(pubDir, relFile), join(outDir, relFile)));

        // output all src files

        const srcWrites = relFileTypes.src.map(relFile => {
          const srcFile = join(pubDir, relFile);
          const srcExt = extname(srcFile);
          const outExt = srcOutExts[srcExt];
          const outFile = replaceExt(join(outDir, relFile), outExt);
          const compiler = srcCompilers.get(srcFile);
          if (!compiler) return Promise.resolve();
          return new Promise((resolve, reject) => {
            try { compiler.stream()
              .pipe(write.stream(outFile))
              .on('close', resolve);
            } catch (error) { reject(error); }
          });
        });

        // output all js files

        const jsWrites = relFileTypes.js.map(relFile => {
          const srcFile = join(pubDir, relFile);
          const outFile = join(outDir, relFile);
          // const srcExt = extname(srcFile);
          // const outExt = srcOutExts[srcExt];
          if (srcFile in bufferCache) {
            return bufferCache[srcFile].then(buffer => {
              return new Promise((resolve, reject) => {
                try { toStream(buffer)
                  .pipe(write.stream(outFile))
                  .on('close', resolve);
                } catch (error) { reject(error); }
              });
            });
          } else {
            let memFile = false;
            try { memFile = memoryFs.statSync(srcFile).isFile(); }
            catch(err) { return; }
            if (!memFile) return Promise.resolve();
            return new Promise((resolve, reject) => {
              try { memoryFs.createReadStream(srcFile)
                .pipe(write.stream(outFile))
                .on('close', resolve);
              } catch (error) { reject(error); }
            });
          }
        });

        return [...srcWrites, ...jsWrites];
      });
    })
    .then(writePromises => {
      Promise.all(writePromises).then(() => {
        allWatchers.forEach(watcher => watcher.close());
        pennyLogger.info('success');
        /* eslint-disable */
        process.exit(0);
        /* eslint-enable */
      });
    })
    .catch(err => pennyLogger.error(err.toString())); // catchAll catch!!
};
