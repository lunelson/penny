// URL-PATTERN vs ANYMATCH
// .e.g matchRoute vs matchGlob
/*
  $pages, $page
  $routes, $route
    data
    href
*/
const $pages = new Map();
$pages.match = function(pattern) {
  // const pat = new UrlPattern(`${pattern}(.html)`);
  return Array.from(this.entries()).map(entry => {
    const match = new UrlPattern(`${pattern}(.html)`).match(entry[0]);
    return match ? Object.assign(entry[1], match) : null;
  }).filter(entry => entry);
};
$pages.set('/posts/foo.html', { title: 'A Foo Post' });
$pages.set('/posts/bar.html', { title: 'A Bar Post' });
$pages.set('/projects/foo.html', { title: 'A Foo Project' });
$pages.set('/projects/bar.html', { title: 'A Bar Project' });
$pages.set('/projects/baz/index.html', { title: 'A Baz Project' });

const UrlPattern = require('url-pattern');
const p1 = new UrlPattern('/projects/:slug(/index)(.html)');

Array.from($pages.entries()).map(entry => {
  const match = p1.match(entry[0]);
  return match ? Object.assign(entry[1], match) : null;
}).filter(entry => entry);//?

$pages.match('/posts/*');//?
p1.match('/posts/index.html');//?
p1.match('/posts/nested/index.html');//?
