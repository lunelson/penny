import parse from '@emmetio/abbreviation';
import Profile from '@emmetio/output-profile';
import format from '@emmetio/markup-formatters';
import transform from '@emmetio/html-transform';

import pug from 'pug';

const pugProfile = new Profile({ indent: '  ' });

// const abbr = parse('table>.row>.col');
const abbr = transform(parse('ul>.item>block'));
// console.log(abbr);
console.log(format(abbr, pugProfile, 'html'));
console.log(format(abbr, pugProfile, 'pug'));

// console.log('mixin _abbr\n'+format(abbr, pugProfile, 'pug').replace(/^(.)/mg, '  $1'));

const testPugString = `
${'mixin _wrap\n'+format(abbr, pugProfile, 'pug').replace(/^(.)/mg, '  $1')}
+_wrap
  h3 hello
`;

console.log(testPugString);
console.log(pug.compile(testPugString));
console.log(format(transform(parse('.outer>.inner*'), pug.render('h1 hello world')), pugProfile, 'html'));
