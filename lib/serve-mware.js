const path = require('path');

const _ = require('lodash');
const parseUrl = require('parseurl');
const anymatch = require('anymatch'); // https://github.com/micromatch/anymatch
const toStream = require('to-readable-stream');
// const requireResolve = require('resolve');

const { pennyLogger } = require('./loggers');
const { srcCompilers } = require('./watch-src');
const { streamCache, memoryFs } = require('./watch-js');
const { outExtTypeHeaders, outSrcExts, replaceExt } = require('./util-general');

function setHeaders(res, ext) {
  // res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', outExtTypeHeaders[ext] || 'application/octet-stream');
}

exports.compilerMiddleware = function(options) {
  const { srcDir, pubDir, outDir } = options;

  return async function(req, res, next) {
    let { pathname: reqFile } = parseUrl(req);
    /**
     * if file path contains leading underscore (hidden files)
     * respond with 403
     */
    if (anymatch(['**/_*/**/*.*', '**/_*.*'], reqFile)) {
      /**
       * TODO: send an HTML response here
       * ?? how to correctly send 403 response with express/connect ??
       */
      res.writeHead(403, 'Forbidden');
      res.end(
        'The requested path contains an underscore-prefixed folder or file. These paths are for imported assets, they are not built or served by Penny.',
      );
      /**
       * NB: next() does not need to be called after res.end().
       * the req-res cycle is over, so we return false
       */
      return false;
      // const body = 'hello world';
      // response
      //   .writeHead(200, {
      //     'Content-Length': Buffer.byteLength(body),
      //     'Content-Type': 'text/plain',
      //   })
      //   .end(body);
    }
    /**
     * correct outExt to '.html' if empty
     * correct path to /index.html if reqFile has trailing slash
     */
    let outExt = path.extname(reqFile);
    if (!outExt) {
      outExt = '.html';
      reqFile = reqFile.replace(/\/$/, '/index') + outExt;
    }
    /**
     * if reqFile is not (html|css|js), OR
     * if reqFile is *minified* (assumed to be already processed),
     * return next() to allow serveStatic to serve it
     */
    if (!/\.(html|css|js)$/.test(reqFile) || /\.min\.(html|css|js)$/.test(reqFile)) return next();

    /**
     * webpack...
     * 1. memoryFs
     */
    const outFile = path.join(outDir, reqFile);
    try {
      const readStream = memoryFs.createReadStream(outFile);
      pennyLogger.debug(`Served from memoryFs: {magenta:${path.relative(outDir, outFile)}}`);
      setHeaders(res, outExt);
      return readStream.pipe(res);
    } catch (err) {
      /**
       * 2. bufferCache
       */
      if (outFile in streamCache) {
        pennyLogger.debug(`Served from bufferCache: {magenta:${path.relative(outDir, outFile)}}`);
        setHeaders(res, outExt);
        return streamCache[outFile].then(buffer => toStream(buffer).pipe(res));
      }
    }

    /**
     * srcCompilers
     */
    const srcFile = outSrcExts[outExt]
      .map(srcExt => replaceExt(path.join(pubDir, reqFile), srcExt))
      .find(srcFile => srcCompilers.has(srcFile));

    if (srcFile) {
      const compiler = srcCompilers.get(srcFile);
      try {
        const readStream = await compiler.stream();
        pennyLogger.debug(`Served via compiler: {magenta:${path.relative(pubDir, srcFile)}}`);
        setHeaders(res, outExt);
        return readStream.pipe(res);
      } catch (err) {
        return next(err);
      }
    } else {
      return next();
    }
  };
};
