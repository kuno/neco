var fs = require('fs'),
path = require('path'),
recordFile = path.join(process.env.NECO_ROOT, '.neco/record.json');

exports.run = function() {
  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
  ecosystems.forEach(function(e) {
    console.log('ID: '+e.id+' Node Ver: '+e.nv+' Created: '+e.cd+' NPM: '+e.npm);
  });
};
