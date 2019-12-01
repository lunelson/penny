const fs = require('fs');
const path = require('path');

const { relative, extname, join, resolve, dirname, basename } = require('path');
const { statSync, readFileSync } = require('fs');

const { eazyLogger, pennyLogger } = require('../../lib/loggers.js');

const srcDir = __dirname;

// from here...
let baseDir = srcDir;
try {
  const rootDir = path.join(srcDir, '_root');
  const stats = fs.statSync(rootDir);
  if (!stats.isDirectory()) throw '_root is present, but not a directory';
  baseDir = rootDir;
} catch (err) {
  console.log(typeof err == Error ? '_root directory not found' : err);
}

console.log(baseDir);

function getPubDir(srcDir, pubDirName) {
  try {
    const pubDir = join(srcDir, pubDirName);
    const stats = statSync(pubDir);
    if (!stats.isDirectory()) throw new Error();
    return pubDir;
  } catch (err) {
    pennyLogger.info(`no sub-directory named ${pubDirName} was found; using source directory as web-root`);
    return srcDir;
  }
}

console.log(getPubDir(resolve(__dirname, '../scratch'), '_root'));

const options = {
  keepFiles: ['CNAME', 'netlify.toml']
};

const keepFileGlob = options.keepFiles.map(fp => `!${fp}`);

console.log(keepFileGlob);
