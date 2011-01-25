var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn;

var log = require('../lib/display.js').log,
getDateTime = require('../lib/assistant.js').getDateTime,
getRelease = require('../lib/assistant.js').getRelease,
getSuitedNPM = require('../lib/assistant.js').getSuitedNPM,
notSmaller = require('../lib/utils.js').compareVersions,
findlongestID = require('../lib/utils.js').findlongestID,
writeLocalConfigFile = require('../lib/assistant.js').writeLocalConfigFile,
writeEcosystemConfigFile = require('../lib/assistant.js').writeEcosystemConfigFile,
getNodeInstallScript = require('../lib/assistant.js').getNodeInstallScript,
getNPMInstallScript = require('../lib/assistant.js').getNPMInstallScript,
getActivateInstallScript = require('../lib/assistant.js').getActivateInstallScript;

var vStartsFrom = require('../include/default.js').vStartsFrom;

var message, warning, error, suggestion, example;

function installNode(release, destDir, next) {
  var error, version, link, install,
  config = process.neco.config, 
  root = config.root,
  script = getNodeInstallScript();

  path.exists(root, function(exists) {
    if (!exists) {
      fs.mkdirSync(root, mode=0777);
    } else {
      if (release.realver) {
        version = release.realver;
      } else {
        version = release.version;
      }
      link = release.link;

      install = spawn('sh', [script, version, link, destDir]);
      install.stdout.on('data', function(data) {
        log.emit('stdout',data);
      });
      install.stderr.on('data', function(data) {
        log.emit('stdout',data);
      });

      install.on('exit', function(code) {
        if (code !== 0) {
          error = new Error('Installing node exit wich code ' + code);
          next(error);
        } else {
          next(error);
        }
      });
    }
  });
}

function installNPM(destDir, npmVer, next) {
  var error,
  config = process.neco.config,  
  pkgDir  = config.pkgDir,
  script  = getNPMInstallScript(), 
  install = spawn('sh', [script, pkgDir, destDir, npmVer]);

  install.stdout.on('data', function(data) {
    log.emit('stdout', data);
  });
  install.stderr.on('data', function(data) {
    log.emit('stdout', data);
  });
  install.on('exit', function(code) {
    if (code !== 0) {
      error = new Error('Installing NPM exit with code ' + code);
      next(error);
    } else {
      next(error);
    }
  });
}

function makeAppDirectory(id, next) {
  var config = process.neco.config,
  root = config.root, 
  appDir = path.join(root, '.neco', id, 'application'),
  appLink = path.join(root, id);

  fs.symlink(appDir, appLink, function(err) {
    next(err);
  });
}

function installActivate(id, release, destDir, next) {
  var error,
  config = process.neco.config,  
  version = release.version, 
  pkgDir  = config.pkgDir, 
  script  = getActivateInstallScript(),
  install = spawn('sh', [script, id, pkgDir, destDir, version]);

  install.stdout.on('data', function(data) {
    log.emit('stdout', data);
  });
  install.stderr.on('data', function(data) {
    log.emit('stdout', data);
  });
  install.on('exit', function(code) {
    if (code !== 0) {
      error = new Error('Installing Activate exit with code ' + code);
      next(error);
    } else {
      next(error);
    }
  });
}

function makeRecord(id, release, npmVer, next) {
  var error,
  config  = process.neco.config,
  date    = getDateTime(),
  version = release.version,  
  root    = config.root,
  recordFile = path.join(root, '.neco', 'record.json'), 
  record, recordData, createdDate, ecosystems, newEcosystem; 

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

    // Write into records file
    fs.writeFile(recordFile, recordData, 'utf8', function(err) {
      next(err);
    });
  });
}

function makeConfigFiles(id, message, next) {
  process.neco.ecosystemConfig = {};
  process.neco.ecosystemConfig.id = id;
  process.neco.ecosystemConfig.message = message;
  writeLocalConfigFile(id, function(err) {
    if (err) {log.emit('error', err);}
    writeEcosystemConfigFile(id, next);
  });
}

exports.run = function(argv) {
  var config = process.neco.config, npmVer,
  id = argv.id, target = argv.target || 'stable',
  release = getRelease(target),
  destDir = path.join(config.root, '.neco', id);

  if (!release) {
    message = 'The desired release '+target+' not found or neco can\'t handle it.';
    suggestion = 'Try a newer version.';
    example = 'neco create <id> stable OR neco create <id> latest';
    log.emit('message', message, suggestion, example);
  } else {
    // If the version of release smaller and equal to 0.1,9,
    // add 'v' prefix to version laterial
    release.realver = (notSmaller(release.version, vStartsFrom) >= 0) ? 'v'.concat(release.version) : null;
    installNode(release, destDir, function(err) {
      if (err) {log.emit('error',err);}
      message = 'Nodejs '+release.version+' has been installed sucessfully!';
      log.emit('message', message);  
      if ((config.installNPM || argv.npm) && getSuitedNPM(release)) {
        npmVer = getSuitedNPM(release);
        installNPM(destDir, npmVer, function(err) {
          if (err) {log.emit('error', err);}
          message = 'NPM '+npmVer+' has been installed sucessfully!';
          log.emit('message', message);
          if (argv.app) {
            makeAppDirectory(id, function(err) {
              if (err) {log.emit('error', err);}
              message = 'The applicaton directory has been created sucessfully!';
              log.emit('message', message);
              installActivate(id, release, destDir, function(err) {
                if (err) {log.emit('error', err);}
                message = 'New activate file has been installed sucessfully!';
                log.emit('message', message);
                makeRecord(id, release, npmVer, function(err) {
                  if (err) {log.emit('error', err);}
                  message = 'Record file has been edited sucessfully!';
                  log.emit('message', message);
                  makeConfigFiles(id, argv.m,  function(err) {
                    if (err) {log.emit('error', err);}
                    message = 'New node ecosystem has been created sucessfully!';
                    log.emit('message', message);
                  }); 
                });
              });
            });
          } else {
            installActivate(id, release, destDir, function(err) {
              if (err) {log.emit('error', err);}
              message = 'New activate file has been installed sucessfully!';
              log.emit('message', message);
              makeRecord(id, release, npmVer, function(err) {
                if (err) {log.emit('error', err);}
                message = 'Record file  has been edited sucessfully!';
                log.emit('message', message);
                makeConfigFiles(id, argv.m,  function(err) {
                  if (err) {log.emit('error', err);}
                  message = 'New node ecosystem has been created sucessfully!';
                  log.emit('message', message);
                }); 
              });
            });  
          }
        });
      } else {
        installActivate(id, release, destDir, function(err) {
          message = 'New activate file has been created sucessfully!';
          log.emit('message', message);  
          if (err) {log.emit('error', err);}
          makeRecord(id, release, npmVern, function(err) {
            if (err) {log.emit('error', err);}
            message = 'Record file has been edited sucessfully!';
            log.emit('message', message);
            makeConfigFiles(id, argv.m,  function(err) {
              if (err) {log.emit('error', err);}
              message = 'New node ecosystem has been created sucessfully!';
              log.emit('message', message);
            });
          });
        });
      }
    });
  }
};
