var path = require('path'),
color = require('ansi-color').set;

exports.run = function(config) {
  var act = path.join(config.pkgDir, 'shell/activate.sh');
  var shell = color('source '+act, 'bold+yellow');
  console.log();
  console.log('add \''+shell+'\' to your .bashrc or .zshrc file, :)');
  console.log('Then run '+color('neco_activate '+config.id, 'bold+yellow')+' in you shell.');
};
