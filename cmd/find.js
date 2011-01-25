var fs = require('fs'),
path = require('path'),
log = require('../lib/display.js').lo9,
show = require('../lib/display.js').show,
getRelease = require('../lib/assistant.js').getRelease;

exports.run = function(argv) {
  var target = argv.target, 
  release, releases = [],
  config = process.neco.config;

  fs.readFile(config.localDistFile, 'utf8', function(err, data) {
    if (err) {log.on('error', err);}
    if (target) {
      release = getRelease(target);
      releases[0] = release;
    } else {
      releases = JSON.parse(data).history;
    }
    show.emit('releases', releases);
  });
};
