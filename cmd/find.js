var fs = require('fs'),
path = require('path'),
show = require('../lib/display.js').showReleases,
getRelease = require('../lib/assistant.js').getRelease;

exports.run = function(target) {
  var release, releases = [],
      config = process.neco.config;
  fs.readFile(config.distFile, 'utf8', function(err, data) {
    if (err) {throw err;}
    if (target) {
      release = getRelease(target);
      releases[0] = release;
    } else {
      releases = JSON.parse(data).history;
    }
    show(releases);
  });
};
