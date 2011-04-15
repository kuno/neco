var fs    = require('fs'),
    path  = require('path'),
    util  = require('util'),
    howto = require('./howto.js');

exports.run = function(argv) {
  var config = process.neco.config,
      pkgJSON = path.join(config.pkgDir, 'package.json'),
      version = JSON.parse(fs.readFileSync(pkgJSON, 'utf8')).version;
  if (argv.cmd === '-v' || argv.cmd === '--version') {
    util.puts(version);
  } else if (argv.cmd === '-h' || argv.cmd === '--help') {
    howto.run(argv);
  }
};
