var fs = require('fs'),
path = require('path'),
show = require('../lib/display.js').showEcosystems;

exports.run = function(config) {
  config.ecosystems = JSON.parse(fs.readFileSync(config.recordFile, 'utf8')).ecosystems;
  show(config.ecosystems);
};
