// export
module.exports = function(srcDir, options) {
  const { isDev, isBuild } = options;
  return class MdCompiler {
    constructor(srcFile) { this.srcFile = srcFile; this.depFiles = []; }
    render() {
    }
    depcheck(absFile){
      if (~this.depFiles.indexOf(absFile)) this.render();
    }
  }
}
