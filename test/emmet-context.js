import parse from '@emmetio/abbreviation';
import Profile from '@emmetio/output-profile';
import format from '@emmetio/markup-formatters';
import pug from 'pug';

const pugProfile = new Profile({ indent: '  ' });

const abbr = parse('ul#test>li.tester'+'>block');
console.log(abbr);
console.log(format(abbr, pugProfile, 'pug'));

console.log('mixin _abbr\n'+format(abbr, pugProfile, 'pug').replace(/^(.)/mg, '  $1'));

const testPugString = `
${'mixin _wrap\n'+format(abbr, pugProfile, 'pug').replace(/^(.)/mg, '  $1')}
+_wrap
  h3 hello
`;

console.log(testPugString);
console.log(pug.render(testPugString));
