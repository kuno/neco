var fs = require('fs'),
path = require('path'),
display = require('../lib/console.js').display;

exports.run = function(config) {
  ecosystems = JSON.parse(fs.readFileSync(config.recordFile, 'utf8')).ecosystems;
  display(ecosystems);
};
