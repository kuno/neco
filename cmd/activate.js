var path = require('path'),
color = require('ansi-color').set;

exports.run = function(argv) {
  var config = process.neco.config, id = argv.id,
  shell = color('source '+config.globalActivateFile, 'bold+yellow');
  deactivate = color('neco_deactivate', 'bold+yellow');

  console.log('add \''+shell+'\' to your .bashrc or .zshrc file, :)');
  console.log('Then run '+color('neco_activate '+id, 'bold+yellow')+' in you shell.');
  console.log('To deactivate it, run \''+deactivate+'\' in you shell.');
};
