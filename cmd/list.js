var fs = require('fs'),
path = require('path'),
log = require('../lib/display.js').log,
getEcosystem = require('../lib/assistant.js').getEcosystem,
show = require('../lib/display.js').show;

exports.run = function(id) {
  var config = process.neco.config;
  var ecosystem, ecosystems = [];
  fs.readFile(config.recordFile, 'utf8', function(err, data) {
    if (err) {log.on('error', err);}
    if (config.target) {
      ecosystem = getEcosystem(id);
      ecosystems[0] = ecosystem;
    } else {
      ecosystems = JSON.parse(data).ecosystems;
    }
    show.emit('ecosystems', ecosystems);
  });
};
