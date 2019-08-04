const path = require('path');
/*

$compiler
  depFiles
  srcFile
  outFile
  reqFile
  options
    isDev
    srcDir
    outDir = srcDir
$data
  {}
$pages
  [ { route }, { route }, ... ]
$page
  { route }
$env
  String
$locales
  []
$locale
  'en'
*/

const baseurl = '/folder';
const locales = ['en', 'fr', 'de'];
const locale = 'fr';
const route = '/path/to/reqFile.html'; // = path.relative(outDir, outFile)

function link(asset = route, lang = locale) {
  const assetPath = path.resolve(path.dirname(route), asset); //?
  const localeBase = locales.indexOf(lang) > 0 ? lang : ''; //?
  return path.join('/', baseurl, localeBase, assetPath); //?
}

link('../foo.css');//?
link('./foo/bar.css');//?
link('foo/bar.css');//?
link('/foo.css');//?

link('../foo.css', 'de');//?
link('./foo/bar.css', 'de');//?
link('foo/bar.css', 'de');//?
link('/foo.css', 'de');//?

link(undefined, 'de');//?
link(undefined, 'de');//?
link(undefined, 'de');//?
link(undefined, 'de');//?
