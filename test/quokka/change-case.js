/*

    camelCase
    constantCase
    dotCase
    headerCase
    lowerCase
    lowerCaseFirst
    noCase
    paramCase
    pascalCase
    pathCase
    sentenceCase
    snakeCase
    swapCase
    titleCase
    upperCase
    upperCaseFirst

    */

const _cases = require('change-case');

_cases.camelCase('test string'); //?
_cases.constantCase('test string'); //?
_cases.dotCase('test string'); //?
_cases.headerCase('test string'); //?
_cases.lowerCase('TEST STRING'); //?
_cases.lowerCaseFirst('TEST'); //?
_cases.noCase('test string'); //?
_cases.paramCase('test string'); //?
_cases.pascalCase('test string'); //?
_cases.pathCase('test string'); //?
_cases.sentenceCase('testString'); //?
_cases.snakeCase('test string'); //?
_cases.swapCase('Test String'); //?
_cases.titleCase('a simple test'); //?
_cases.upperCase('test string'); //?
_cases.upperCaseFirst('test'); //?


const {
  noCase,
  dotCase,
  swapCase,
  pathCase,
  upperCase,
  lowerCase,
  camelCase,
  snakeCase,
  titleCase,
  paramCase,
  headerCase,
  pascalCase,
  constantCase,
  sentenceCase,
  upperCaseFirst,
  lowerCaseFirst,
} = _cases;

camelCase('test string'); //?
constantCase('test string'); //?
dotCase('test string'); //?
headerCase('test string'); //?
lowerCase('TEST STRING'); //?
lowerCaseFirst('TEST'); //?
noCase('test string'); //?
paramCase('test string'); //?
pascalCase('test string'); //?
pathCase('test string'); //?
sentenceCase('testString'); //?
snakeCase('test string'); //?
swapCase('Test String'); //?
titleCase('a simple test'); //?
upperCase('test string'); //?
upperCaseFirst('test'); //?

const {
  no,
  dot,
  swap,
  path,
  upper,
  lower,
  camel,
  snake,
  title,
  param,
  header,
  pascal,
  constant,
  sentence,
  isUpper,
  isLower,
  ucFirst,
  lcFirst
} = _cases;

_cases.camel('test string'); //?
_cases.constant('test string'); //?
_cases.dot('test string'); //?
_cases.header('test string'); //?
_cases.lower('TEST STRING'); //?
_cases.lcFirst('TEST'); //?
_cases.no('test string'); //?
_cases.param('test string'); //?
_cases.pascal('test string'); //?
_cases.path('test string'); //?
_cases.sentence('testString'); //?
_cases.snake('test string'); //?
_cases.swap('Test String'); //?
_cases.title('a simple test'); //?
_cases.upper('test string'); //?
_cases.ucFirst('test'); //?

camel('test string'); //?
constant('test string'); //?
dot('test string'); //?
header('test string'); //?
lower('TEST STRING'); //?
lcFirst('TEST'); //?
no('test string'); //?
param('test string'); //?
pascal('test string'); //?
path('test string'); //?
sentence('testString'); //?
snake('test string'); //?
swap('Test String'); //?
title('a simple test'); //?
upper('test string'); //?
ucFirst('test'); //?
