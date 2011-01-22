var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
removeEcosystem = require('../lib/utils.js').removeEcosystem,
getEcosystem = require('../lib/assistant.js').getEcosystem,    
writeGlobalConfigFile = require('../lib/assistant.js').writeGlobalConfigFile;

var log = require('../lib/display.js').log;
var message ,warning, error, suggestion, example;

function removeDir(id, next) {
  var error, remove, config = process.neco.config,
  root = config.root, targetDir = path.join(root, '.neco', id);

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
          next(error);
        } else {
          next(error);
        }
      });
    }
  });
}

function editRecord(id, next) {
  var error, index, record, ecosystem, 
  recordData, config = process.neco.config, 
  recordFile = config.recordFile;

  path.exists(recordFile, function(exists) {
    if (!exists) {
      error = new Error('Record file dose not exists.');
      next(error, config);
    } else {
      fs.readFile(recordFile, 'utf8', function(err, data) {
        if (err) {throw err;}
        record = JSON.parse(data);
        record.ecosystems = removeEcosystem(record.ecosystems, id);
        recordData = JSON.stringify(record);
        fs.writeFile(recordFile, recordData, 'utf8', function(err) {
          error = err;
          next(error);
        });
      });
    }
  });
}

function editConfig(id) {
  var config = process.neco.config;
  writeGlobalConfigFile(config, function(err, config) {
    if (err) {throw err;}
    message = 'Ecosystem '+id+' has been removed sucessfully!';
    log('message', message);
  });
}

exports.run = function(id) {
  removeDir(id, function(err) {
    if (err) {throw err;}
    message = 'Target directory has been removeed sucessfully!';
    log('message', message);  
    editRecord(id, function(err) {
      if (err) {throw err;}
      message = 'Ecosystems record file has been edited sucessfully!';
      log('message', message);  
      editConfig(id);
    });
  });
};
