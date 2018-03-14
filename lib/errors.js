//   ___ _ __ _ __
//  / _ \ '__| '__|
// |  __/ |  | |
//  \___|_|  |_|

// const stripAnsi = require('strip-ansi');

function contentChar(code) {
  const model ='\\00000';
  code = code.toString(16);
  return model.slice(0, model.length - code.length) + code;
}

function cssContent(str) {
  return `${str}`
    .split('')
    .map((char) => {
      const code = char.charCodeAt();
      // NB: it might be necessary to have ensure that the generated code is exactly 5 characters long
      // return (code < 65 || code > 127) ? contentChar(code) : char;
      return (code < 65 || code > 127) ? `\\00${code.toString(16)} ` : char;
    })
    .join('');
}

function errRule(message, bgcolor) {
  return `
  display: block;
  box-sizing: border-box;
  font-family: monospace;
  font-size: 1.25em;
  line-height: 1.25;
  white-space: pre-wrap;
  width: 100%;
  min-height: 6em;
  padding: 1em;
  content: '${cssContent(message)}';
  background-color: ${bgcolor};
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 73"%3E %3Cg fill="%23959595" fill-rule="evenodd" transform="translate(-160 -54)"%3E %3Cpath d="M235.65625 82.15625H182.8125c-4.60813 0-8.34375 3.73562-8.34375 8.34375s3.73562 8.34375 8.34375 8.34375h52.84375V112.75h-11.125v13.90625H210.625V112.75h-13.90625v13.90625H182.8125V112.75c-12.28834 0-22.25-9.96166-22.25-22.25s9.96166-22.25 22.25-22.25V54.34375h13.90625V68.25H210.625V54.34375h13.90625V68.25h11.125v13.90625z"/%3E %3Ccircle cx="248.5" cy="119.5" r="7.5"/%3E %3C/g%3E %3C/svg%3E ');
  background-repeat: no-repeat;
  background-position: 2em 1em;
  background-size: 5em;
  padding-left: 9em;
  `.replace(/\n/g,'');
}

function cssErr(message, bgcolor) {
  return `html:before { ${errRule(message, bgcolor)} }`;
}

function htmlCssErr(message, bgcolor) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Error</title>
    <style>
      html:before { ${errRule(message, bgcolor)} }
    </style>
  </head>
  <body>
  </body>
  </html>
  `;
}

function jsCssErr(message, bgcolor) {
  const rule = errRule(message, bgcolor);
  return `
  var style = document.createElement('style');
  style.appendChild(document.createTextNode(''));
  document.head.appendChild(style);
  if ("insertRule" in style.sheet) { style.sheet.insertRule("html:before {" + ${JSON.stringify(rule)} + "}", 0); }
  else if ("addRule" in style.sheet) { style.sheet.addRule("html:before", ${JSON.stringify(rule)}, 0); }
  `;
}

module.exports = {
  cssErr,
  jsCssErr,
  htmlCssErr
};
