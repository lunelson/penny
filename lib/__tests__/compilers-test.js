const fs = require('fs');
const path = require('path');

const test = require('ava');
const writeFile = require('write');

const { srcOutExts, outSrcExts } = require('../util-general');

const srcDir = path.resolve(__dirname, './__fixtures__/compilers');
const outDir = path.resolve(__dirname, './__renders__/compilers');
const pubDir = srcDir;

const srcFiles = fs
  .readdirSync(srcDir)
  .filter(fileName => fileName.match(/^source\.?/))
  .map(fileName => path.join(srcDir, fileName));

srcFiles.forEach(srcFile => {
  const srcExt = path.extname(srcFile);
  const Compiler = !srcExt
    ? require('../compile')
    : require(`../compile-${srcExt.slice(1)}`);

  const devCompiler = new Compiler(srcFile, {
    isDev: true,
    srcDir,
    outDir,
    pubDir,
    onCompile(err) {
      console.error(err);
      throw err;
    },
  });

  const outExt = srcOutExts[srcExt] || '';
  const outFile = path.join(
    outDir,
    path
      .relative(pubDir, srcFile)
      .replace(
        new RegExp(`source${srcExt}$`),
        `output${srcExt == outExt ? outExt : srcExt + outExt}`,
      ),
  );

  test(`compile ${srcExt ? srcExt : '.txt (raw)'} content`, async t => {
    const out = await devCompiler.output();
    writeFile.sync(outFile, out);
    t.pass();
    // t.snapshot(out);
  });
});
