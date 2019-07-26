const fs = require('fs');
const path = require('path');

const test = require('ava');
const writeFile = require('write');

const srcDir = path.resolve(__dirname, './__fixtures__/compilers');
const outDir = path.resolve(__dirname, './__renders__/compilers');

const srcFiles = fs
  .readdirSync(srcDir)
  .filter(fileName => fileName.match(/^source\.?/))
  .map(fileName => path.join(srcDir, fileName));

srcFiles.forEach(srcFile => {
  const ext = path.extname(srcFile);
  const Compiler = !ext
    ? require('../compile')
    : require(`../compile-${ext.slice(1)}`);

  const devCompiler = new Compiler(srcFile, {
    isDev: true,
    srcDir,
    outDir,
    pubDir: srcDir,
    onCompile(err) {
      console.error(err);
      throw err;
    },
  });

  const outFile = path.join(
    outDir,
    path.relative(srcDir, srcFile).replace(/source/, 'output'),
  );

  test(`compile ${ext ? ext : '.txt (raw)'} content`, async t => {
    const out = await devCompiler.output();
    writeFile.sync(outFile, out);
    t.pass();
    // t.snapshot(out);
  });
});
