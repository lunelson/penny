const tests = [
  'some/file/without/ext',
  'anotehr/file/with-one.ext',
  'finally/one/with.two.exts',
];

function sliceExt(str) {
  const extIndex = str.lastIndexOf('.');
  return ~extIndex ? str.slice(0, extIndex) : str;
}

function syncFileObj(obj, file, event, cb) {
  const path = sliceExt(str).split('/').slice(1);
  if (event == 'unlink') {
    _.unset(obj, path);
    while (--path.length && _.isEmpty(_.get(obj, path))) {
      _.unset(obj, path);
    }
  } else _.set(obj, path, cb(file));
}

console.log(tests.map(sliceExt));
syncFileObj(event, $data, dataPath, file => readData(file));

const $pages = Object.create(null);
bsync.watch(['**/*.(pug|md|mdown)'], {
  ignored: [],
  cwd: srcDir
}, (event, file) => {
  const pagePath = file.replace(/\.(pug|md|mdown)$/,'').split('/').slice(1);
  syncFileObj(event, $pages, pagePath, file => {
    const { data, isEmpty } = matter(readFileSync(srcFile, 'utf8'));
    return Object.assign(data, {
      // TODO: dirname, filename, basedir, pathname
      filename: file
    });
  });
});
