const { jsCssErr, cssErr, cssEsc } = require('../lib/serve-err');

console.log(cssEsc(`
a lne
b "more"
c then;
`, {
    wrap: true,
    quotes: 'single'
}));

console.log(cssErr(`
a lne
b "more"
c then;
`, 'blue'));
