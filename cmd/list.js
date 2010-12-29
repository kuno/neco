var fs = require('fs'),
path = require('path'),
display = require('../lib/console.js').display,
recordFile = path.join(process.env.NECO_ROOT, '.neco/record.json');

exports.run = function() {
  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
  display(ecosystems);
};
