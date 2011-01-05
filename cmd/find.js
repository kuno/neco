var fs = require('fs'),
path = require('path'),
show = require('../lib/display.js').showReleases,
getRelease = require('../lib/assistant.js').getRelease;

exports.run = function(config) {
  var releases = [], release;
  fs.readFile(config.distFile, 'utf8', function(err, data) {
    if (err) {throw err;}
    if (config.target) {
      release = getRelease(config);
      releases[0] = release;
    } else {
      releases = JSON.parse(data).history;
    }
    show(releases);
  });
};
