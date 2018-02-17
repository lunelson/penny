import './nest/import';
// import {dirname, resolve} from 'path';
// import 'babel-polyfill';
// import url from 'url';
// import lodash from 'lodash';
// console.log(lodash.times);
console.log('hello world');
console.log('this is the one for Vue: '+process.env.NODE_ENV);
// console.log('for commonJS is it this: '+NODE_ENV);

let { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
console.log({x,y,z});

console.log('and this really seems to be workng now!!??');
