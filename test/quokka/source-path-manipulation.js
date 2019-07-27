let foo;
foo = 5; //?

const path = require('path');

const { srcOutExts, outSrcExts } = require('../../lib/util-general');

srcOutExts;
outSrcExts;

const srcDir = '/path/to/src';
const outDir = '/path/to/out';

const srcFiles = outSrcExts['.html']
  .map(ext => `/path/to/src/source${ext}`); //?

const outFiles = srcFiles.map(srcFile => {
  const srcExt = path.extname(srcFile);//?
  const outExt = srcOutExts[srcExt]; //?
  const outFile = path.join(outDir, path.relative(srcDir, srcFile));//?
  return outFile.replace(new RegExp(`source${srcExt}$`), `output${srcExt==outExt?outExt:srcExt+outExt}`);
}); //?