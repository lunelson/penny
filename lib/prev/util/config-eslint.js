module.exports = function configureEslint(userConfig) {

  const baseConfig = {
    'env': {
      'browser': true,
      'es6': true
    },
    'extends': [
      'plugin:import/errors',
      'plugin:import/warnings'
    ],
    'parserOptions': {
      'sourceType': 'module',
      'ecmaFeatures': {
        'experimentalObjectRestSpread': true
      }
    },
    'globals': {
      'process': false // protect for usage of process.env.NODE_ENV
    },
    'settings': {
      'import/resolver': {
        'babel-module': {
          'root': null,
        }
      }
    },

    'rules': {
      'for-direction': ['error'],
      'getter-return': ['error', { 'allowImplicit': true }],
      'no-await-in-loop': ['error'],
      'no-compare-neg-zero': ['error'],
      'no-cond-assign': ['error', 'except-parens'],
      // 'no-console': ['error'],
      // 'no-constant-condition': ['error'],
      'no-control-regex': ['error'],
      // 'no-debugger': ['error'],
      'no-dupe-args': ['error'],
      'no-dupe-keys': ['error'],
      'no-duplicate-case': ['error'],
      // 'no-empty': ['error'],
      'no-empty-character-class': ['error'],
      'no-ex-assign': ['error'],
      'no-extra-boolean-cast': ['error'],
      'no-extra-parens': ['error'],
      'no-extra-semi': ['error'],
      'no-func-assign': ['error'],
      'no-inner-declarations': ['error'],
      'no-invalid-regexp': ['error'],
      'no-irregular-whitespace': ['error', { 'skipComments': true }],
      'no-obj-calls': ['error'],
      // 'no-prototype-builtins': ['error'],
      'no-regex-spaces': ['error'],
      'no-sparse-arrays': ['error'],
      'no-template-curly-in-string': ['error'],
      'no-unexpected-multiline': ['error'],
      // 'no-unreachable': ['error'],
      'no-unsafe-finally': ['error'],
      'no-unsafe-negation': ['error'],
      'use-isnan': ['error'],
      // 'valid-jsdoc': ['error'],
      'valid-typeof': ['error'],
    }
  };

  return baseConfig;
};
