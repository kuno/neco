var path = require('path'),
color = require('ansi-color').set;

exports.run = function(config) {
  var shell = color('source '+config.globalActivateFile, 'bold+yellow');
  console.log('add \''+shell+'\' to your .bashrc or .zshrc file, :)');
  console.log('Then run '+color('neco_activate '+config.id, 'bold+yellow')+' in you shell.');
};
