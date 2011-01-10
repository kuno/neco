var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
getEcosystem = require('../lib/assistant.js').getEcosystem,    
writeGlobalConfigFile = require('../lib/assistant.js').writeGlobalConfigFile;

var log = require('../lib/display.js').log;
var message ,warning, error, suggestion, example;

function removeDir(config, next) {
  var error, remove, targetDir;
  targetDir = path.join(config.root, '.neco', config.id);

  path.exists(targetDir, function(exists) {
    if (!exists) {
      error = new Error('Target directory '+targetDir+' not exists.');
      next(error, next);
    } else {
      remove = spawn('rm', ['-rf', targetDir]);
      remove.stdout.on('data', function(data) {
        log('stdout', data);
      });
      remove.stderr.on('data', function(data) {
        log('stdout', data);
      });
      remove.on('exit', function(code) {
        if (code !== 0) {
          err = new Error('Remove exit with code '+code);
          next(error, config);
        } else {
          next(error, config);
        }
      });
    }
  });
}

function editRecord(config, next) {
  var error, index, record, ecosystem, recordData, 
  id = config.id, recordFile = config.recordFile;
  path.exists(recordFile, function(exists) {
    if (!exists) {
      error = new Error('Record file dose not exists.');
      next(error, config);
    } else {
      fs.readFile(recordFile, 'utf8', function(err, data) {
        if (err) {throw err;}
        record = JSON.parse(data);
        index = record.ecosystems.indexOf(getEcosystem(config));
        record.ecosystems.splice(index, 1);
        recordData = JSON.stringify(record);
        fs.writeFile(recordFile, recordData, 'utf8', function(err) {
          error = err;
          next(error, config);
        });
      });
    }
  });
}

function editConfig(config) {
  var id = config.id;
  writeGlobalConfigFile(config, function(err, config) {
    if (err) {throw err;}
    message = 'ecosystem '+id+' has been removed sucessfully.';
    log('message', message);
  });
}

exports.run = function(config) {
  removeDir(config, function(err) {
    if (err) {throw err;}
    editRecord(config, function(err, config) {
      if (err) {throw err;}
      editConfig(config);
    });
  });
};
