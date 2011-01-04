var path = require('path'), 
docsDir = path.join(__dirname, '../docs'),
helpDocFile = path.join(docsDir, 'help.json');

exports.run = function(config) {
  if (config.cmd === undefined) {
    console.log('neco - Nodejs Ecosystem COordinator, like virtualenv for python.');
    console.log('Usage:\n  neco <command>');
    console.log('');
    console.log('Currently where <command> should be on of the below commands:\n');
    console.log('  create      -  create new node ecosystem');
    console.log('     Useage: neco create <id> [node-version]');
    console.log('');
    console.log('  list        -  list all installed node ecosystem');
    console.log('     Usage: neco list');
    console.log('');
    console.log('  activate    -  show how to activate an existing node ecosystem');
    console.log('     Usage: neco activate <id>');
    console.log('');
    console.log('  deactivate  -  show how to deactivate an active node ecosystem');
    console.log('     Usage: neco deactivate [id]');
    console.log('');
    console.log('  help        -  show help information');
    console.log('     Usage: neco help');
    console.log('');
    console.log('Git repository: http://github.com/kuno/neco');
  } else {
  }
};
