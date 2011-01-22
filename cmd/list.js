var fs = require('fs'),
path = require('path'),
getEcosystem = require('../lib/assistant.js').getEcosystem,
show = require('../lib/display.js').showEcosystems;

exports.run = function(id) {
  var config = process.neco.config;
  var ecosystem, ecosystems = [];
  fs.readFile(config.recordFile, 'utf8', function(err, data) {
    if (err) {throw err;}
    if (config.target) {
      ecosystem = getEcosystem(id);
      ecosystems[0] = ecosystem;
    } else {
      ecosystems = JSON.parse(data).ecosystems;
    }
    show(ecosystems);
  });
};
