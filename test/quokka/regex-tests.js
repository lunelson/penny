console.log('hello')

const { htmlSrcExtGroup, cssSrcExtGroup } = require('../../lib/util-general');

htmlSrcExtGroup;

const htmlSrcExtRE = new RegExp(`\.${htmlSrcExtGroup}$`);

'/foo/bar.pug'.replace(htmlSrcExtRE, '.html');//?
'/foo/bar.html'.replace(htmlSrcExtRE, '.html');//?
'/foo/bar.htm'.replace(htmlSrcExtRE, '.html');//?
'/foo/bar.md'.replace(htmlSrcExtRE, '.html');//?
'/foo/bar.njk'.replace(htmlSrcExtRE, '.html');//?
'/foo/bar.ejs'.replace(htmlSrcExtRE, '.html');//?
