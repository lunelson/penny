const MemoryFS = require('memory-fs'); // https://github.com/webpack/memory-fs
module.exports = { memoryFs: new MemoryFS(), bufferCache: Object.create(null) }
