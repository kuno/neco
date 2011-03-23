var howto   = require('./howto.js'), 
    version = require('../../include/meta.js').version;

exports.run = function(argv) {
  if (argv.cmd === '-v' || argv.cmd === '--version') {
    console.log(version);
  } else if (argv.cmd === '-h' || argv.cmd === '--help') {
    howto.run(argv);
  }
};
