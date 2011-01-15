var fs = require('fs'),
path = require('path'),
getEcosystem = require('../lib/assistant.js').getEcosystem,
show = require('../lib/display.js').showEcosystems;

exports.run = function(config) {
  var ecosystem;
  config.ecosystems = [];
  fs.readFile(config.recordFile, 'utf8', function(err, data) {
    if (err) {throw err;}
    if (config.target) {
      ecosystem = getEcosystem(config);
      config.ecosystems[0] = ecosystem;
    } else {
      config.ecosystems = JSON.parse(data).ecosystems;
    }
    show(config);
  });
};
