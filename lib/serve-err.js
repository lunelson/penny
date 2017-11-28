//                _____
//               |  ___|
//   ___ ___ ___ | |__ _ __ _ __
//  / __/ __/ __||  __| '__| '__|
// | (__\__ \__ \| |__| |  | |
//  \___|___/___/\____/_|  |_|

const cssEsc = require('cssesc');
function cssErr(message, bgcolor) {
  return `
  html { font-size: 1em; position: relative; }
  html:before {
    position: absolute;
    top: 0; left: 0;
    display: block;
    width: 100%;
    padding: 1rem;
    font-family: monospace;
    content: '${cssEsc(message)}';
    white-space: pre-wrap;
    background-color: ${bgcolor};
  }`;
}

module.exports = {
  cssErr
};
