const url = require('url');

const UrlPattern = require('url-pattern');
const _ = require('lodash');

const pageList = [
  { route: "/index.html" },
  { route: "/guide/intro.html" },
  { route: "/pages/article-index.html" },
  { route: "/pages/article-single.html" },
  { route: "/pages/event-index.html" },
  { route: "/pages/generic-index.html" },
  { route: "/pages/generic-single.html" },
  { route: "/pages/homepage-lfv.html" },
  { route: "/pages/homepage.html" },
  { route: "/pages/institute-index.html" },
  { route: "/pages/misc-ansprechpartner.html" },
  { route: "/pages/institute-single.html" },
  { route: "/pages/misc-president.html" },
  { route: "/pages/museum-index.html" },
  { route: "/pages/museum-single.html" },
  { route: "/pages/post-index.html" },
  { route: "/pages/post-single.html" },
  { route: "/pages/section-index.html" },
  { route: "/pages/section-single.html" },
  { route: "/types/feature-index.html" },
  { route: "/types/generic-index.html" },
  { route: "/types/generic-single.html" },
  { route: "/types/homepage.html" },
  { route: "/types/magazin.html" },
  { route: "/tests/advert-flow.html" },
  { route: "/tests/banners.html" },
  { route: "/tests/buttons.html" },
  { route: "/tests/clamping-a.html" },
  { route: "/tests/clamping-b.html" },
  { route: "/tests/content.html" },
  { route: "/tests/fields.html" },
  { route: "/tests/forms.html" },
  { route: "/tests/headers.html" },
  { route: "/tests/homework.html" },
  { route: "/tests/images.html" },
  { route: "/tests/listing-flow.html" },
  { route: "/tests/listing-table.html" },
  { route: "/tests/marquee.html" },
  { route: "/tests/metainfo.html" },
  { route: "/tests/monads.html" },
  { route: "/tests/partials.html" },
  { route: "/tests/refactors-519.html" },
  { route: "/tests/search-result.html" },
  { route: "/tests/sliders.html" },
  { route: "/tests/teaser-flow.html" },
  { route: "/tests/templating.html" },
  { route: "/guide/bases/index.html" },
  { route: "/guide/layouts/index.html" },
  { route: "/guide/modules/index.html" },
  { route: "/guide/partials/index.html" },
  { route: "/guide/components/index.html" },
  { route: "/tests/reference/casual.html" },
  { route: "/tests/reference/faker.html" },
  { route: "/tests/bases/colors.html" },
  { route: "/tests/bases/icons.html" },
  { route: "/tests/bases/links.html" },
  { route: "/tests/bases/text.html" },
  { route: "/tests/_deprecated/flickity.html" },
  { route: "/tests/_deprecated/slider-custom/index.html" },
  { route: "/tests/_deprecated/slider-swiper/index.html" },
  { route: "/tests/pages-api.html" },
];

// const $pages = Object.create(Array.prototype);
const $pages = [];
$pages.match = function(pattern) {
  function doMatch($page) {
    const result = new UrlPattern(`${pattern}(.html)`).match($page.route);
    return result ? Object.assign($page, result) : result;
  }
  return _.compact(this.map(doMatch));
};

$pages.push(...pageList);
$pages;
$pages.match('/pages/home*'); //?
$pages.length = 0;
$pages.match('/pages/home*'); //?

const $page = { route: '/foo/bar/baz' };

function matchRoute(obj
  pattern) {
  function doMatch(obj) {
    const result = new UrlPattern(`${pattern}(.html)`).match(obj.route);
    return result ? Object.assign(obj, result) : result;
  }
  return Array.isArray(obj) ? _.compact(obj.map(doMatch)) : doMatch(obj);
}


const dynamicEntries = ['/some/$shit/$thing', '/posts/$post'];

const matchers = dynamicEntries.map(
  urlPath => {
    const pattern = url.parse(urlPath).pathname.replace(/\$/g, ':') + '(.html)';
    return new UrlPattern(pattern);
  }
); //?

const $dynPages = matchers.slice();
$dynPages.match = function(pattern) {
  let match = null;
  this.find(matcher => match = matcher.match(pattern));
  return match;
}

console.log('TEST', $dynPages.match('/posts/whatever.html'));
// const matchers = dynamicEntries.map(pat => new UrlPattern(pat)); //?

let match = null;
// _.find(matchers, matcher => match = matcher.match('/posts/whatever'));
matchers.find(matcher => match = matcher.match('/posts/whatever'));
match;

matchers
  .find(matcher => matcher.match('/posts/whatever'))
  .match('/posts/whatever'); //?

matchers
  .find(matcher => matcher.match('/posts/whatever'))
  .stringify({ post: 'wtf' }); //?
