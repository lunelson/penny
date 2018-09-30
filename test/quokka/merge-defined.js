const _ = require('lodash');

console.log(_.pick(undefined, ['foo']));
console.log(_.pick({foo: 'bar'}, ['foo']));

const mergeDefined = _.partialRight(
  _.assignWith,
  (objValue, srcValue) => _.isUndefined(srcValue) ? objValue : srcValue
);

// test
mergeDefined({ 'a': 1 }, { 'b': 2 }, { 'a': undefined }); //?

const browserSyncOptions = {
  browser: 'foo'
};

console.log(_.pick(browserSyncOptions, [
  'browser',
  'codeSync',
  'ghostMode',
  'injectChanges',
  'notify',
  'open',
  'reloadDebounce',
  'reloadDelay',
  'reloadThrottle',
  'scrollElementMapping',
  'scrollElements',
  'scrollProportionally',
  'scrollRestoreTechnique',
  'scrollThrottle',
  'startPath',
  'timestamps',
]));

const {
  ghostMode,
  open,
  browser,
  notify,
  scrollProportionally,
  scrollThrottle,
  scrollRestoreTechnique,
  scrollElements,
  scrollElementMapping,
  reloadDelay,
  reloadDebounce,
  reloadThrottle,
  injectChanges,
  startPath,
  codeSync,
  timestamps,
} = browserSyncOptions;

const defaults = {
  ghostMode: true,
  open: true,
  browser: true,
  notify: true,
  scrollProportionally: true,
  scrollThrottle: true,
  scrollRestoreTechnique: true,
  scrollElements: true,
  scrollElementMapping: true,
  reloadDelay: true,
  reloadDebounce: true,
  reloadThrottle: true,
  injectChanges: true,
  startPath: true,
  codeSync: true,
  timestamps: true,
}

console.log(mergeDefined({}, defaults, {
  ghostMode,
  open,
  browser,
  notify,
  scrollProportionally,
  scrollThrottle,
  scrollRestoreTechnique,
  scrollElements,
  scrollElementMapping,
  reloadDelay,
  reloadDebounce,
  reloadThrottle,
  injectChanges,
  startPath,
  codeSync,
  timestamps,
}));

console.log(Object.assign({}, defaults, {
  ghostMode,
  open,
  browser,
  notify,
  scrollProportionally,
  scrollThrottle,
  scrollRestoreTechnique,
  scrollElements,
  scrollElementMapping,
  reloadDelay,
  reloadDebounce,
  reloadThrottle,
  injectChanges,
  startPath,
  codeSync,
  timestamps,
}));
