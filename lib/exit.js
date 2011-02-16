var EventEmitter = require('events').EventEmitter;

function _success() {
  console.log('');
  console.log('[Done!]');
  process.exit(0);
}

function _fail() {
  console.log('');
  console.log('[Failed!]');
  process.exit(1);
}

var exit = new EventEmitter;

exit.on('success', _success);
exit.on('fail', _fail);

exports.exit = exit;
