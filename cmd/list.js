var fs = require('fs'),
path = require('path'),
show = require('../lib/console.js').showEcosystems;

exports.run = function(config) {
  var ecosystems = JSON.parse(fs.readFileSync(config.recordFile, 'utf8')).ecosystems;
  show(ecosystems);
};
