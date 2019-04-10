require('timers');

function debounce(fn, delay = 100, immediate) {
  let timeout;
  return function(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) fn.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
    if (callNow) fn.apply(this, args);
  };
}

function reloadAction(exts) {
  console.log(exts.map(ext => `*${ext}`));
}

let reloadTimeout;
const reloadExts = new Set();
function bsyncReload(...exts) {
  exts.forEach(ext => reloadExts.add(ext));
  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => {
    reloadAction([...reloadExts]);
    reloadTimeout = null;
    reloadExts.clear();
  }, 100);
}

const logMe = debounce(t => {
  console.log(t);
});

bsyncReload('.html');
bsyncReload('.html', '.css');
bsyncReload('.html', '.js');
bsyncReload('.css');

setTimeout(() => {
  bsyncReload('.html');
  bsyncReload('.html', '.js');
}, 200);
