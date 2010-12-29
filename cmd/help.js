var path = require('path'), 
docsDir = path.join(__dirname, '../docs'),
helpDocFile = path.join(docsDir, 'help.json');

exports.run = function(cmd) {
  if (cmd === undefined) {
    console.log('neco - Nodejs Ecosystem COordinator, like virtualenv for python.');
    console.log('Usage:\n  nc <command>');
    console.log('');
    console.log('Currently where <command> should be on of the below commands:\n');
    console.log('  create      -  create new node ecosystem');
    console.log('     Useage: nc create <id> [node-version]');
    console.log('');
    console.log('  list        -  list all installed node ecosystem');
    console.log('     Usage: nc list');
    console.log('');
    console.log('  activate    -  show how to activate a existing node ecosystem.');
    console.log('     Usage: nc activate <id>');
    console.log('');
    console.log('  deactivate  -  show how to deactivate a active ecosystem.');
    console.log('     Usage: nc deactivate [id]');
    console.log('');
    console.log('Git repository: http://github.com/kuno/neco');
  } else {
  }
};
