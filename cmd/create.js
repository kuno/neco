var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn;

var log = require('../lib/display.js').log,
getDateTime = require('../lib/assistant.js').getDateTime,
getRelease = require('../lib/assistant.js').getRelease,
getSuitedNPM = require('../lib/assistant.js').getSuitedNPM,
notSmaller = require('../lib/utils.js').compareVersions,
findlongestID = require('../lib/utils.js').findlongestID,
writeGlobalConfigFile = require('../lib/assistant.js').writeGlobalConfigFile,
writeEcoSystemConfigFile = require('../lib/assistant.js').writeEcoSystemConfigFile,
getNodeInstallScript = require('../lib/assistant.js').getNodeInstallScript,
getNPMInstallScript = require('../lib/assistant.js').getNPMInstallScript,
getActivateInstallScript = require('../lib/assistant.js').getActivateInstallScript;

var vStartsFrom = require('../include/default.js').vStartsFrom;

var message, warning, error, suggestion, example;

function installNode(config, callback) {
  var error, version, link, install, 
  destDir = config.destDir, script = getNodeInstallScript(config);

  path.exists(config.root, function(exists) {
    if (!exists) {
      fs.mkdirSync(config.root, mode=0777);
    } else {
      if (config.release.realver) {
        version = config.release.realver;
      } else {
        version = config.release.version;
      }
      link = config.release.link;

      install = spawn('sh', [script, version, link, destDir]);
      install.stdout.on('data', function(data) {
        log('stdout',data);
      });
      install.stderr.on('data', function(data) {
        log('stdout',data);
      });

      install.on('exit', function(code) {
        if (code !== 0) {
          error = new Error('Installing node exit wich code ' + code);
          callback(error, config);
        } else {
          callback(error, config);
        }
      });
    }
  });
}

function installNPM(config, callback) {
  var error, destDir = config.destDir, pkgDir = config.pkgDir,
  script = getNPMInstallScript(config), npmVer = config.npmVer;
  install = spawn('sh', [script, pkgDir, destDir, npmVer]);

  install.stdout.on('data', function(data) {
    log('stdout', data);
  });
  install.stderr.on('data', function(data) {
    log('stdout', data);
  });
  install.on('exit', function(code) {
    if (code !== 0) {
      error = new Error('Installing NPM exit with code ' + code);
      callback(error, config);
    } else {
      callback(error, config);
    }
  });
}

function installActivate(config, callback) {
  var error, id = config.id, version = config.release.version, 
  pkgDir = config.pkgDir, destDir = config.destDir, 
  script = getActivateInstallScript(config),
  install = spawn('sh', [script, id, pkgDir, destDir, version]);

  install.stdout.on('data', function(data) {
    log('stdout', data);
  });
  install.stderr.on('data', function(data) {
    log('stdout', data);
  });
  install.on('exit', function(code) {
    if (code !== 0) {
      error = new Error('Installing Activate exit with code ' + code);
      callback(error, config);
    } else {
      callback(error, config);
    }
  });
}

function makeRecord(config) {
  var error, npmVer = config.npmVer || 'none',
  id = config.id, version = config.release.version,
  record, recordData, createdDate, ecosystems, newEcosystem, 
  recordFile = path.join(config.root, '.neco', 'record.json'), 
  date = getDateTime(config);

  path.exists(recordFile, function(exists) {
    if (!exists) {
      record = {};
      ecosystems = [];
    }
    else {
      record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
      ecosystems = record.ecosystems;
    }

    newEcosystem = {id:id, cd:date,nv:version, npm:npmVer};
    record.ecosystems = ecosystems.concat(newEcosystem);
    recordData = JSON.stringify(record);
    config.idLenStandard = findlongestID(config);

    // Write into records file
    fs.writeFile(recordFile, record, 'utf8', function(err) {
      if (err) {throw err;}
      message = 'New node ecosystem has been created sucessfully!';
      log('message', message);
      writeGlobalConfigFile(config, function(err, config) {
        if (err) {throw err;}
        writeEcoSystemConfigFile(config);
      });
    });
  });
}

exports.run = function(config) {
  config.release = getRelease(config);
  if (!config.release) {
    error = 'The desired release '+config.target+' not found or neco can\'t handle it.';
    suggestion = 'Try a newer version.';
    example = 'neco create <id> stable OR neco create <id> latest';
    log('error', error, suggestion, example);
  } else {
    // If the version of release smaller and equal to 0.1,9,
    // add 'v' prefix to version laterial
    if (notSmaller(config.release.version, vStartsFrom) >= 0) {
      config.release.realver = 'v'.concat(config.release.version);
    }

    config.destDir = path.join(config.root, '.neco', config.id);

    installNode(config, function(err, config) {
      if (err) {throw err;} 
      if (config.installNPM && getSuitedNPM(config)) {
        config.npmVer = getSuitedNPM(config);
        installNPM(config, function(err, config) {
          if (err) {throw err;}
          installActivate(config, function(err, config) {
            if (err) {throw err;} 
            makeRecord(config);
          });
        });
      } else {
        installActivate(config, function(err, config) {
          if (err) {throw err;}
          makeRecord(config);
        });
      }
    });
  }
};
