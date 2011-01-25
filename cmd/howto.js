var path = require('path');

exports.run = function(argv) {
  if (argv.cmd === undefined) {
    console.log('neco - Nodejs Ecosystem COordinator, like virtualenv for python.');
    console.log('');
    console.log('Usage:\n  neco <command>');
    console.log('');
    console.log('Currently where <command> should be one of the below commands:\n');
    console.log('  create      -  create new node ecosystem');
    console.log('      Useage: neco create <id> [node-version]');
    console.log('');
    console.log('  remove      -  removed installed ecosystem');
    console.log('       Usage:  neco remove <id>');
    console.log('');
    console.log('  list        -  list all installed node ecosystem');
    console.log('      Usage:  neco list');
    console.log('');
    console.log('  find        - find out available node release(s)');
    console.log('      Usage:  neco find [stable, latest, <version>]');
    console.log('');
    console.log('  activate    -  show how to activate an existing node ecosystem');
    console.log('      Usage:  neco activate <id>');
    console.log('');
    console.log('  deactivate  -  show how to deactivate an active node ecosystem');
    console.log('      Usage:  neco deactivate <id>');
    console.log('');
    console.log('  howto        -  show usage information');
    console.log('      Usage:  neco howto');
    console.log('');
    console.log('Git repository: http://github.com/kuno/neco');
  } else {
  }
};
