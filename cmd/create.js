var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn;

var log = require('../lib/console.js').log,
getRelease = require('../lib/utils.js').getRelease,
getSuitedNPM = require('../lib/utils.js').getSuitedNPM,
notSmaller = require('../lib/utils.js').compareVersions,
getNodeInstallScript = require('../lib/utils.js').getNodeInstallScript,
getNPMInstallScript = require('../lib/utils.js').getNPMInstallScript,
getActivateInstallScript = require('../lib/utils.js').getActivateScript;

var root = path.join(process.env.NECO_ROOT, '.neco') || path.join(process.env.HOME, '.neco'),  
pkgDir = path.join(__dirname, '..'), vStartsFrom = require('../include/default.js').vStartsFrom ;

function installNode(config, callback) {
  var error, version, link, install, 
  targetDir = config.targetDir, script = getNodeInstallScript();

  path.exists(config.root, function(exists) {
    if (!exists) {
      fs.mkdirSync(config.root, mode=0777);
    }

    if (config.release.realver) {
      version = config.release.realver;
    } else {
      version = config.release.version;
    }
    link = config.release.link;

    install = spawn('sh', [script, version, link, targetDir]);
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
  });
}

function installNPM(config, callback) {
  var error, targetDir = config.targetDir,
  script = getNPMInstallScript,
  install = spawn('sh', [script, pkgDir, targetDir, npmVer]);

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
  var error, targetDir = path.join(config.root, id),
  script = getActivateInstallScript,
  install = spawn('sh', [script, pkgDir, targetDir, release.version]);

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
  var npm, record, createdDate, ecosystems, 
  newEcosystem, date = new Date(),
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
    createdDate = date.toDateString(date.getTime());
    newEcosystem = {id:config.id, cd:createdDate,nv:config.release.version, npm:npm};
    record.ecosystems = ecosystems.concat(newEcosystem);
    record = JSON.stringify(record);

    // Write into records file
    fs.writeFile(recordFile, record, 'utf8', function(err) {
      if (err) {throw err;}
      config.message = 'New node ecosystem has been created sucessfully!';
      log('message', config);
    });
  });
}

exports.run = function(config) {
  config.release = getRelease(config.nodeVer);

  if (!config.release) {
    config.error = 'The desired release '+config.nodeVer+' not found or neco can\'t handle it.';
    config.suggestion = 'Try a newer version.';
    config.example = 'neco create <id> stable OR neco create <id> latest';
    log('error', config);
  } else {
    // If the version of release smaller and equal to 0.1,9,
    // add 'v' prefix to version laterial
    if (notSmaller(config.release.version, vStartsFrom) >= 0) {
      config.release.realver = 'v'.concat(config.release.version);
    }

    config.root = root;
    config.targetDir = path.join(config.root, config.id);
    config.npmVer = getSuitedNPM(config.release.version);  

    installNode(config, function(err, config) {
      if (err) {throw err;}
      //console.log('suited npm version is '+npmVer);
      if (config.npmVer) {
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
