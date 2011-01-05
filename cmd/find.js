var fs = require('fs'),
path = require('path'),
show = require('../lib/display.js').showReleases,
getRelease = require('../lib/assistant.js').getRelease;

exports.run = function(config) {
  var release;
  config.releases = [];
  fs.readFile(config.distFile, 'utf8', function(err, data) {
    if (err) {throw err;}
    if (config.target) {
      release = getRelease(config);
      config.releases[0] = release;
    } else {
      config.releases = JSON.parse(data).history;
    }
    show(config);
  });
};
