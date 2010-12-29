var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn;

var log = require('../lib/console.js').log,
getRelease = require('../lib/utils.js').getRelease,
getSuitedNPM = require('../lib/utils.js').getSuitedNPM;

var   packageDir = path.join(__dirname, '..'),   
NodeInstallScript = path.join(__dirname, '../shell/install_node.sh'),
NPMInstallScript  = path.join(__dirname, '../shell/install_npm.sh'),
ActivateInstallScript = path.join(__dirname, '../shell/install_activate.sh');

var message, warning, error;

function installNode(root, id, release, callback) {
  var err, install, targetDir = path.join(root, id);
  path.exists(root, function(exists) {
    if (!exists) {
      fs.mkdirSync(root, mode=0777);
    }
    install = spawn(NodeInstallScript, [release.version, release.link, targetDir]);
    install.stdout.on('data', function(data) {
      log('stdout',data);
    });
    install.stderr.on('data', function(data) {
      log('stdout',data);
    });

    install.on('exit', function(code) {
      if (code !== 0) {
        err = new Error('Installing node exit wich code ' + code);
        callback(err, root, id, release);
      } else {
        callback(err, root, id, release);
      }
    });
  });
}

function installNPM(root, id, release, npmVer, callback) {
  var err, install, targetDir = path.join(root, id);
  install = spawn(NPMInstallScript, [packageDir, targetDir, npmVer]);
  install.stdout.on('data', function(data) {
    log('stdout', data);
  });
  install.stderr.on('data', function(data) {
    log('stdout', data);
  });
  install.on('exit', function(code) {
    if (code !== 0) {
      err = new Error('Installing NPM exit with code ' + code);
      callback(err, root, id, release);
    } else {
      callback(err, root, id, release);
    }
  });
}

function installActivate(root, id, release, callback) {
  var err, install, targetDir = path.join(root, id);
  install = spawn(ActivateInstallScript, [packageDir, targetDir, release.version]);
  install.stdout.on('data', function(data) {
    log('message', data);
  });
  install.stderr.on('data', function(data) {
    console.log('message', data);
  });
  install.on('exit', function(code) {
    if (code !== 0) {
      err = new Error('Installing Activate exit with code ' + code);
      callback(err, root, id, release);
    } else {
      callback(err, root, id, release);
    }
  });
}

function makeRecord(root, id, release, npmVer) {
  var date, record, createdDate, recordFile, 
  ecosystems, newEcosystem;
  date = new Date();
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

    createdDate = date.toDateString(date.getTime());
    newEcosystem = {id:id, cd:createdDate,nv: release.version, npm:npmVer};
    record.ecosystems = ecosystems.concat(newEcosystem);
    record = JSON.stringify(record);

    // Write into records file
    fs.writeFile(recordFile, record, 'utf8', function(err) {
      if (err) {throw err;}
      messge = 'Sucessfully create new node ecosystem!';
      log('message', message);
    });
  });
}

exports.run = function(id, target) {
  var root, npmVer, release;
  release = getRelease(target);

  if (!release) {
    error = 'Desired release '+target + ' not found.';
    log('error', error);
  } else {
    npmVer = getSuitedNPM(release.version);  
    root = path.join(process.env.NECO_ROOT, '.neco') || path.join(process.env.WORKON_HOME, '.neco');

    installNode(root, id, release, function(err, root, id, release) {
      if (err) {throw err;}
      if (npmVer) {
        installNPM(root, id, release, npmVer, function(err, root, id, release) {
          if (err) {throw err;}
          installActivate(root, id, release, function(err, root, id, release) {
            if (err) {throw err;} 
            makeRecord(root, id, release, npmVer);
          });
        });
      } else {
        installActivate(root, id, release, function(err, root, id, release) {
          if (err) {throw err;}
          makeRecord(root, id, release, npmVer);
        });
      }
    });
  }
};
