var fs = require('fs'),
path = require('path'),
show = require('../lib/console.js').showReleases;

exports.run = function(config) {
  var releases = [], release;
  fs.readFile(config.distFile, 'utf8', function(err, data) {
    if (err) {throw err;}
    if (config.target) {
      release = getRelease(config);
      releases[0] = release;
    } else {
      console.log(data);
      releases = JSON.parse(data).history;
    }
    show(releases);
  });
};
