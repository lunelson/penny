console.log('this is z');
function getFoo() { return import('./_hidden/foo.js'); }
setTimeout(() => {
  getFoo().then(module => {
    console.log(module);
  })
}, 1000);
