var color    = require('ansi-color').set,
EventEmitter = require('events').EventEmitter,
rightParentheses = color('[', 'green'),
leftParentheses  = color(']', 'green');

function _nothing() {
  var nothing = color('Nothing!', 'white+bold');
  console.log(rightParentheses + nothing + leftParentheses);
  process.exit(0);
}

function _success() {
  var done = color('Done!', 'yellow+bold');
  console.log(rightParentheses + done + leftParentheses);
  process.exit(0);
}

function _fail() {
  var fail = color('Failed!', 'red+bold');
  console.log(rightParentheses + fail + leftParentheses);
  process.exit(1);
}

var exit = new EventEmitter;

exit.on('nothing', _nothing);
exit.on('success', _success);
exit.on('fail', _fail);

exports.exit = exit;
