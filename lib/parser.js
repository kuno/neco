var os = require('os'),
fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..');

exports.parseArgv = function() {
  var argv = {}, flags;

  argv.cmd = process.argv[2];
  if (!/^-.*/.test(process.argv[3])) {
    if (argv.cmd === 'find') {
      argv.target = process.argv[3];
    } else {
      argv.id = process.argv[3];
    }
  }
  if (!/^-.*/.test(process.argv[4])) {
    argv.target = process.argv[4];
  }

  flags = process.argv.slice(2, process.argv.length);
  flags.forEach(function(f) {
    if (/^-\w/.test(f)) {
      argv[f.replace(/-+/,'')] = flags[flags.indexOf(f)+1];
    } else if (/^--\w/.test(f)) {
      argv[f.replace(/-+/,'')] = true;
    }
  });

  return argv;
};
