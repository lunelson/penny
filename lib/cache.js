const MemoryFS = require('memory-fs'); // https://github.com/webpack/memory-fs
module.exports = { memoryFs: new MemoryFS(), outFileCache: Object.create(null) }
