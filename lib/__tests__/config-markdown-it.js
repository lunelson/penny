const mdiOptions = {};

const mdi = require('../config-markdown-it.js')(mdiOptions);
const mdi2 = require('../config-markdown-it.js')(mdiOptions);

test('mdi only configs once', () => {
  expect(mdi).toEqual(mdi2);
});

test('block rendering', () => {
  expect(mdi.render('hello __world__')).toMatchSnapshot();
});

test('inline rendering', () => {
  expect(mdi.renderInline('hello __world__')).toMatchSnapshot();
});
