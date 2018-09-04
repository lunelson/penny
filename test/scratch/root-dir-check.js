const fs = require('fs');
const path = require('path');

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
