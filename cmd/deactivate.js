var path = require('path'),
color = require('ansi-color').set;

exports.run = function(config) {
  var shell = color('deactivate', 'bold+yellow');
  console.log('run \''+shell+' command in your shell, :)');
};
