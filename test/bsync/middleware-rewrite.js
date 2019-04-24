function setHeaders(res, ext) {
  // res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', outExtContentTypes[ext] || 'application/octet-stream');
}

function srcController(req, res, next) {
  let { pathname: outFile } = parseUrl(req);

  // bail if file path contains leading underscore (hidden files)
  if (anymatch(['**/_*/**/*.*', '**/_*.*'], outFile)) {
    res.writeHead(403, 'Forbidden');
    res.end(
      'The requested path contains an underscore-prefixed folder or file. These paths are for imported assets, they are not built or served by Penny.',
    );
    return false;
  }

  // correct outExt to '.html' if empty; correct path to /index.html if reqFile has trailing slash
  let outExt = extname(outFile);
  if (!outExt) { outExt = '.html'; outFile = outFile.replace(/\/$/, '/index') + outExt; }

  // calc absolute path of output file
  const outFile = join(pubDir, outFile);

  // webpack: try memoryFs
  let memFile = false;
  try { memFile = memoryFs.statSync(outFile).isFile(); } catch (_) { /* memFile will remain false! */ }
  if (memFile) {
    setHeaders(res, outExt); // set headers
    pennyLogger.debug(`Served from memoryFs: {magenta:${outFile}}`);
    return memoryFs.createReadStream(outFile).pipe(res);
  }

  // webpack: try bufferCache
  if (outFile in bufferCache) {
    setHeaders(res, outExt); // set headers
    pennyLogger.debug(`Served from bufferCache: {magenta:${outFile}}`);
    return bufferCache[outFile].then(buffer => toStream(buffer).pipe(res));
  }

  // src: bail if reqFile is not src, or if it is *minified* src
  if (!/\.(html|css|js)$/.test(outFile) || /\.min\.(html|css|js)$/.test(outFile)) return next();

  // src: see if any compilers have it
  else {
    const srcFile = outSrcExts[outExt] && outSrcExts[outExt]
      .map(srcExt => replaceExt(outFile, srcExt))
      .find(srcFile => srcCompilers.has(srcFile));

    if (srcFile) {
      setHeaders(res, outExt); // set headers
      pennyLogger.debug(`Served via compiler: {magenta:${relative(pubDir, srcFile)}}`);
      const compiler = srcCompilers.get(srcFile);
      return compiler.stream().pipe(res);
    }
  }

  // otherwise give up
  return next();
}
