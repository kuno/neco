var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn;

var vStartsFrom = require('../include/default.js').vStartsFrom;

var log = require('../lib/console.js').log,
getRelease = require('../lib/utils.js').getRelease,
getSuitedNPM = require('../lib/utils.js').getSuitedNPM,
notSmaller = require('../lib/utils.js').compareVersions,
getNodeInstallScript = require('../lib/utils.js').getNodeInstallScript,
getNPMInstallScript = require('../lib/utils.js').getNPMInstallScript,
getActivateScript = require('../lib/utils.js').getActivateScript;

var pkgDir = path.join(__dirname, '..'), message, warning, error, suggestion, example;

function installNode(root, id, release, callback) {
  var error, version, link, install, targetDir = path.join(root, id);
  path.exists(root, function(exists) {
    if (!exists) {
      fs.mkdirSync(root, mode=0777);
    }

    if (release.realver) {
      ver = release.realver;
    } else {
      ver = release.version;
    }
    link = release.link;

    install = spawn('sh', [script, ver, link, targetDir]);
    install.stdout.on('data', function(data) {
      log('stdout',data);
    });
    install.stderr.on('data', function(data) {
      log('stdout',data);
    });

    install.on('exit', function(code) {
      if (code !== 0) {
        error = new Error('Installing node exit wich code ' + code);
        callback(error, root, id, release);
      } else {
        callback(error, root, id, release);
      }
    });
  });
}

function installNPM(root, id, release, npmVer, callback) {
  var script, error, install, targetDir = path.join(root, id);
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
      callback(error, root, id, release);
    } else {
      callback(error, root, id, release);
    }
  });
}

function installActivate(root, id, release, callback) {
  var script, error, install, targetDir = path.join(root, id);
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
      callback(error, root, id, release);
    } else {
      callback(error, root, id, release);
    }
  });
}

function makeRecord(root, id, release, npmVer) {
  var npm, date, record, createdDate, recordFile, 
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

    npm = npmVer ? npmVer : 'none';
    createdDate = date.toDateString(date.getTime());
    newEcosystem = {id:id, cd:createdDate,nv:release.version, npm:npm};
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

exports.run = function(id, target) {
  var root, npmVer, release;
  release = getRelease(target);

  if (!release) {
    error = 'The desired release '+target+' not found or neco can\'t handle it.';
    suggestion = 'Try a newer version.';
    example = 'neco create <id> stable OR neco create <id> latest';
    log('error', error, suggestion, example);
  } else {

    // If the version of release smaller and equal to 0.1,9,
    // add 'v' prefix to version laterial
    if (notSmaller(release.version, vStartsFrom) >= 0) {
      release.realver = 'v'.concat(release.version);
    }    
    npmVer = getSuitedNPM(release.version);  
    root = path.join(process.env.NECO_ROOT, '.neco') || path.join(process.env.WORKON_HOME, '.neco');

    installNode(root, id, release, function(err, root, id, release) {
      if (err) {throw err;}
      //console.log('suited npm version is '+npmVer);
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
