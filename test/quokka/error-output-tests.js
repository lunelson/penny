/*

ENTITY CONVERSION

reference
https://github.com/brajeshwar/entities

libs, html/xml
https://github.com/mdevils/node-html-entities
https://github.com/fb55/entities (core of above)
https://github.com/m90/entity-convert (may be less good)

css
https://github.com/mathiasbynens/cssesc

LOGGING MANAGEMENT

https://github.com/pimterry/loglevel
https://github.com/xpl/ololog

https://github.com/chalk/chalk
https://github.com/nuxt/friendly-errors-webpack-plugin

ANSI CONVERSION

https://github.com/Tjatse/ansi-html (then convert entities)
https://github.com/xpl/ansicolor


*/

// const chalk = require('chalk')
// const ansiHTML = require('ansi-html')

// var str = chalk.bold.red('foo') + ' bar'
// console.log('[ANSI]', str)
// console.log('[HTML]', ansiHTML(str))

// str = chalk.bold.red('foo') + ' fin ' + chalk.bold.magenta('foo')
// console.log('[ANSI]', str)
// console.log('[HTML]', ansiHTML(str))

// ansiHTML.setColors({
//   'reset': ['555', '666'],
//   black: 'aaa',
//   red: 'bbb',
//   green: 'ccc',
//   yellow: 'ddd',
//   blue: 'eee',
//   magenta: 'fff',
//   cyan: '999',
//   lightgray: '888',
//   darkgray: '777'
// })
// console.log('[HTML]', ansiHTML(str))


// const logLevel = require('loglevel')
// const supportsColor = require('supports-color')

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();


var entityconvert = require('entity-convert');
// console.log(entityconvert.css('We äll löve Ümläutß!'));
// console.log(entityconvert.html('We äll löve Ümläutß!'));

// console.log(entities.encode('<>"&©®∆')); // &lt;&gt;&quot;&amp;&copy;&reg;∆
// console.log(entities.encodeNonUTF('<>"&©®∆')); // &lt;&gt;&quot;&amp;&copy;&reg;∆
// console.log(entities.encodeNonASCII('<>"&©®∆')); // &lt;&gt;&quot;&amp;&copy;&reg;∆
// console.log(entityconvert.html('<>"&©®∆')); // &lt;&gt;&quot;&amp;&copy;&reg;∆
console.log(entityconvert.css('<>"&©®∆')); // &lt;&gt;&quot;&amp;&copy;&reg;∆

const cssesc = require('cssesc');
console.log(cssesc('<>"&©®∆')); // &lt;&gt;&quot;&amp;&copy;&reg;∆

// console.log(entities.encodeNonUTF('<>"&©®∆')); // &lt;&gt;&quot;&amp;&copy;&reg;&#8710;
// console.log(entities.encodeNonASCII('<>"&©®∆')); // <>"&©®&#8710;
// console.log(entities.decode('&lt;&gt;&quot;&amp;&copy;&reg;')); // <>"&©®
// console.log(entities.encode(`<div id="hovercard-aria-description" class="sr-only"> Press h to open a hovercard with more details. </div>`));

// var entities2 = require("entities");
// //encoding
// console.log(entities2.encodeXML("&#38;"));  // "&amp;#38;"
// console.log(entities2.escape("&#38;"));  // "&amp;#38;"
// console.log(entities2.escape(entities2.encodeXML("&#38;")));  // "&amp;#38;"
// console.log(entities2.encodeHTML("&#38;")); // "&amp;&num;38&semi;"
// //decoding
// console.log(entities2.decodeXML("asdf &amp; &#xFF; &#xFC; &apos;"));  // "asdf & ÿ ü '"
// console.log(entities2.decodeHTML("asdf &amp; &yuml; &uuml; &apos;")); // "asdf & ÿ ü '"
