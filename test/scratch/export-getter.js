const pageMap = new Map();

pageMap.set('foo', { foo: 'bar' });

module.exports = {
  get $pages() { return Array.from(pageMap.values()); }
};
