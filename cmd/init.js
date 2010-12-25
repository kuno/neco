var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
getRelease = require('../lib/utils.js').getRelease,
NodeInstallScript = '../shell/install_node.sh',
NPMInstallScript  = '../shell/install_npm.sh',
ActivateInstallScript = '../shell/install_activate.sh';

function installNode(root, id, release, callback) {
  var err, install, targetDir = path.join(root, id);
  path.exists(root, function(exists) {
    if (!exists) {
      fs.mkdirSync(root, mode=0777);
    }
    install = spawn(NodeInstallScript, [release.version, release.link, targetDir]);
    install.stdout.on('data', function(data) {
      console.log('Insalling node ' + data);
    });
    install.stderr.on('data', function(data) {
      console.log('Installing node stderr: ' + data);
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

function installNPM(root, id, release, callback) {
  var err, install, targetDir = path.join(root, id);
  install = spawn(NPMInstallScript, [targetDir]);
  install.stdout.on('data', function(data) {
    console.log('Installing NPM stdout: ' + data);
  });
  install.stderr.on('data', function(data) {
    console.log('Installing NPM stderr: ' + data);
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

  install = spawn(ActivateInstallScript, [targetDir]);
  install.stdout.on('data', function(data) {
    console.log('Installing Activate stdout: ' + data);
  });
  install.stderr.on('data', function(data) {
    console.log('Installing Activate stderr: ' + data);
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

function makeRecord(root, id, release) {
  var date, records, ecosystem, ecosystems, newEcosystem;
  date = new Date();
  records = path.join(root, 'ecosystems.json');

  path.exists(records, function(exists) {
    if (!exists) {
      ecosystems = [];
    }
    else {
      ecosystems = JSON.parse(fs.readFileSync(records, 'utf8'));
    }

    installDate = date.toUTCString(date.getTime());
    newEcosystem = {id:id, installDate:installDate,
    nodeVer: release.version};

    ecosystems = JSON.stringify(ecosystems.concat(newEcosystem));
    console.log(ecosystems);
    // Write into records file
    fs.writeFile(records, ecosystems, 'utf8', function(err) {
      if (err) {throw err;}
      console.log('Saved new ecosystem to records file!');
    });
  });
}

exports.install = function(id, target) {
  var root, release = getRelease(target);   
  if (!release) {
    console.log('Err: Desired release ' + target + ' not found.');
  } else {
    root = path.join(process.env.NECO_ROOT, '.neco') || path.join(process.env.WORKON_HOME, '.neco');

    installNode(root, id, release, function(err, root, id, release) {
      if (err) {throw err;}
      installNPM(root, id, release, function(err, root, id, release) {
        if (err) {throw err;}
        installActivate(root, id, release, function(err, root, id, release) {
          if (err) {throw err;} 
          makeRecord(root, id, release);
        });
      });
    });
  }
};
