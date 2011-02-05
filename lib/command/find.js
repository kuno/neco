var fs = require('fs'),
path = require('path'),
log = require('../display.js').lo9,
show = require('../display.js').show,
getRelease = require('../assistant.js').getRelease;

exports.run = function(argv) {
  var target = argv.target, 
  release, releases = [],
  config = process.neco.config;

  fs.readFile(config.localDistFile, 'utf8', function(err, data) {
    if (err) {log.emit('error', err);}
    if (target) {
      release = getRelease(target);
      releases[0] = release;
    } else {
      releases = JSON.parse(data).history;
    }
    show.emit('releases', releases);
  });
};
