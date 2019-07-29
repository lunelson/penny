/* CSS UNIT PARSING */

// function parseUnit(str, out) {
//   if (!out) out = [ 0, '' ];
//   str = String(str);
//   var num = parseFloat(str, 10);
//   out[0] = num;
//   out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || '';
//   return out;
// }

// function unit(value) {
//   var len = value.length;
//   if (!value || !len) return null;
//   var i = len; while (i--) {
//     if (!isNaN(value[i])) return value.slice(i + 1, len) || null;
//   }
//   return null
// }

const parseUnit = require('parse-unit');

parseUnit('a100x'); //?
parseUnit('100deg'); //?
parseUnit('#100b00'); //?

parseUnit('10em'); //?
parseUnit('10ex'); //?
parseUnit('10ch'); //?
parseUnit('10rem'); //?
parseUnit('10vw'); //?
parseUnit('10vh'); //?
parseUnit('10vmin'); //?
parseUnit('10vmax'); //?

const colorString = require('color-string');

colorString.get('#FFF'); //?
colorString.get('#FFFA'); //?
colorString.get('#FFFFFFAA'); //?
colorString.get('hsl(360, 100%, 50%)'); //?
colorString.get('blue'); //?
colorString.get('rgba(200, 60, 60, 0.3)'); //?
colorString.get('rgb(200, 200, 200)'); //?

colorString.get.hsl('hsl(360, 100%, 50%)'); //?
colorString.get.hsl('hsla(360, 60%, 50%, 0.4)'); //?

colorString.get.hwb('hwb(60, 3%, 60%)'); //?
colorString.get.hwb('hwb(60, 3%, 60%, 0.6)'); //?

colorString.get.rgb('invalid color string'); //?

function parseCSSString(str) {
  const unit = parseUnit(str);
  if (!isNaN(unit[0])) return unit;
  const color = colorString.get(str);
  return color || str;
}

parseCSSString('a100x'); //?
parseCSSString('100deg'); //?
parseCSSString('#100b00'); //?
