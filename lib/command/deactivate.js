var path = require('path'),
color = require('ansi-color').set;

var exit = require('../exit.js').exit;

exports.run = function(argv) {
  var id = argv.id,
  shell = color('neco_deactivate', 'bold+yellow');

  console.log('run \''+shell+' command in your shell, :)');
  exit.emit('success');
};
