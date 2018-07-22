// OBJECT REST/SPREAD
const alpha = {a: 1};
const beta = {b: 3};
console.log(JSON.stringify({...alpha, ...beta}, null, 2));

// DEBOUNCE
const _ = require('lodash');
const foo = _.debounce((str) => console.log(str), 100);
foo('hi 1');
foo('hi 2');
foo('hi 3');
foo('hi 4');

// URL-PATTERN vs ANYMATCH
// .e.g matchRoute vs matchGlob
/*
  $pages, $page
  $routes, $route
    data
    href
*/
const $pages = new Map();
$pages.match = function(pattern){
  // const pat = new UrlPattern(`${pattern}(.html)`);
  return Array.from(this.entries()).map(entry => {
    const match = new UrlPattern(`${pattern}(.html)`).match(entry[0]);
    return match ? Object.assign(entry[1], match) : null;
  }).filter(entry => entry);
}
$pages.set('/posts/foo.html', { title: "A Foo Post" });
$pages.set('/posts/bar.html', { title: "A Bar Post" });
$pages.set('/projects/foo.html', { title: "A Foo Project" });
$pages.set('/projects/bar.html', { title: "A Bar Project" });
$pages.set('/projects/baz/index.html', { title: "A Baz Project" });

const UrlPattern = require('url-pattern');
const p1 = new UrlPattern('/projects/:slug(/index)(.html)');

Array.from($pages.entries()).map(entry => {
  const match = p1.match(entry[0]);
  return match ? Object.assign(entry[1], match) : null;
}).filter(entry => entry);//?

$pages.match('/posts/*');//?
p1.match('/posts/index.html');//?
p1.match('/posts/nested/index.html');//?

// QS
const qs = require('qs');
