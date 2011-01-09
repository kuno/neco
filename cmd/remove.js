var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn;

function removeDir(config, next) {
  var error, cmd, targetDir;
  targetDir = path.join(config.root, '.neco', config.id);

  console.log(targetDir);
}

function editRecordFile(config, next) {
}

function editConfigFile(config) {
}

exports.run = function(config) {
  removeDir(config, function(err) {
    if (err) {throw err;}
    editRecord(config);
  });
};

