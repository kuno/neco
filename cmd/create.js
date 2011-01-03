var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn;

var log = require('../lib/console.js').log,
getDateTime = require('../lib/utils.js').getDateTime,
getRelease = require('../lib/utils.js').getRelease,
getSuitedNPM = require('../lib/utils.js').getSuitedNPM,
notSmaller = require('../lib/utils.js').compareVersions,
getNodeInstallScript = require('../lib/utils.js').getNodeInstallScript,
getNPMInstallScript = require('../lib/utils.js').getNPMInstallScript,
getActivateInstallScript = require('../lib/utils.js').getActivateInstallScript;

var pkgDir = path.join(__dirname, '..'), 
root = process.env.NECO_ROOT || process.env.HOME;

var vStartsFrom = require('../include/default.js').vStartsFrom;

var message, warning, error, suggestion, example;

function installNode(config, callback) {
  var error, version, link, install, 
  destDir = config.destDir, script = getNodeInstallScript();

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
  var error, destDir = config.destDir,
  script = getNPMInstallScript(), npmVer = config.npmVer;
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
  var error, version = config.release.version, 
  destDir = config.destDir,script = getActivateInstallScript(),
  install = spawn('sh', [script, pkgDir, destDir, version]);

  install.stdout.on('data', function(data) {
    log('stdout', data);
  });
  install.stderr.on('data', function(data) {
    console.log('stdout', data);
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
  var npm, record, createdDate, ecosystems, newEcosystem, 
  recordFile = path.join(root, 'record.json');

  path.exists(recordFile, function(exists) {
    if (!exists) {
      record = {};
      ecosystems = [];
    }
    else {
      record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
      ecosystems = record.ecosystems;
    }

    npm = config.npmVer ? config.npmVer : 'none';
    createdDate = getDateTime(config);
    newEcosystem = {id:config.id, cd:createdDate,nv:config.release.version, npm:npm};
    record.ecosystems = ecosystems.concat(newEcosystem);
    record = JSON.stringify(record);

    // Write into records file
    fs.writeFile(recordFile, record, 'utf8', function(err) {
      if (err) {throw err;}
      message = 'New node ecosystem has been created sucessfully!';
      log('message', message);
    });
  });
}

exports.run = function(config) {
  config.release = getRelease(config.nodeVer);
  if (!config.release) {
    error = 'The desired release '+config.nodeVer+' not found or neco can\'t handle it.';
    suggestion = 'Try a newer version.';
    example = 'neco create <id> stable OR neco create <id> latest';
    log('error', error, suggestion, example);
  } else {
    // If the version of release smaller and equal to 0.1,9,
    // add 'v' prefix to version laterial
    if (notSmaller(config.release.version, vStartsFrom) >= 0) {
      config.release.realver = 'v'.concat(config.release.version);
    }

    config.root = path.join(root, '.neco');
    config.destDir = path.join(config.root, config.id);

    installNode(config, function(err, config) {
      if (err) {
        throw err;
      } else if (config.insallNPM) {
        config.npmVer = getSuitedNPM(config.release.version);
        if (config.npmVer) {
          installNPM(config, function(err, config) {
            if (err) {throw err;}
            installActivate(config, function(err, config) {
              if (err) {throw err;} 
              makeRecord(config);
            });
          });
        } 
      } else {
        installActivate(config, function(err, config) {
          if (err) {throw err;}
          makeRecord(config);
        });
      }
    });
  }
};
