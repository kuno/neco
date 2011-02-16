var fs = require('fs'),
path   = require('path');

var log    = require('../display.js').log,
handle     = require('../exception.js').handle,
exit       = require('../exit.js').exit,
show       = require('../display.js').show,
getRelease = require('../assistant.js').getRelease;

exports.run = function(argv) {
  var target = argv.target, 
  release, releases = [],
  config = process.neco.config;

  fs.readFile(config.localDistFile, 'utf8', function(err, data) {
    if (err) {handle.emit('error', err);}
    if (target) {
      release = getRelease(target);
      releases[0] = release;
    } else {
      releases = JSON.parse(data).history;
    }
    show.emit('releases', releases);
    exit.emit('success');
  });
};
