var util = require('util'),
    howto   = require('./howto.js'), 
    version = require('../../include/meta.js').version;

exports.run = function(argv) {
  if (argv.cmd === '-v' || argv.cmd === '--version') {
    util.puts(version);
  } else if (argv.cmd === '-h' || argv.cmd === '--help' || argv.cmd === '--howto') {
    howto.run(argv);
  }
};
