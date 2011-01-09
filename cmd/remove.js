var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
findlongestID = require('../lib/utils.js').findlongestID,
getEcosystem = require('../lib/assistant.js').getEcosystem,    
writeConfigFiles = require('../lib/assistant.js').writeConfigFiles;

var log = require('../lib/display.js').log;

function removeDir(config, next) {
  var error, remove, targetDir;
  targetDir = path.join(config.root, '.neco', config.id);

  console.log(targetDir);
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
          err = new Error('Remove exists with code '+code);
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
        ecosystem = getEcosystem(config);
        console.log(ecosystem);
        record = JSON.parse(data);
        index = record.ecosystems.indexOf(getEcosystem(config));
        record.ecosystems.splice(index, 1);
        recordData = JSON.stringify(record);
        console.log(recordData);
        fs.writeFile(recordFile, recordData, 'utf8', function(err) {
          error = err;
          next(error, config);
        });
      });
    }
  });
}

function editConfig(config) {
  config.idLenStandard = findlongestID(config);
  writeConfigFiles(config);
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
