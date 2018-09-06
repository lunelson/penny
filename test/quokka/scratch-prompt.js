const yn = require('yn');

function confirm(message, callback) {
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  process.stdout.write(`Confirm: ${message} [Y]`);
  process.stdin.once('data', function(data) {
    var ok = yn(data) || data.trim() == '';
    try { callback(ok); } catch (e) { throw new Error(e); }
    process.stdin.pause();
  });
}

confirm('You are about to process 400 files. Proceed?', (ok) => {
  console.log(`the response was ${ok}`);
  if (!ok) process.exit();
});
