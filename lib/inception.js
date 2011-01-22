var fs = require('fs'),
path = require('path'),
log = require('./display.js').log,
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
ecosystem = process.env.NODE_ECOSYSTEM,
recordFile = path.join(root, '.neco/record.json'),
pkgDistFile = path.join(pkgDir, 'data/dist.json'),
pkgConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
pkgActivateFile = path.join(pkgDir, 'shell/activate.sh'),
globalDistFile = path.join(root, '.neco/dist.json'),
globalConfigFile = path.join(root, '.neco/config.json'),
globalActivateFile = path.join(root, '.neco', 'activate.sh'),
findlongestID = require('./assistant.js').findlongestID,
copyFile = require('./utils.js').copyFile,
isBigger = require('./utils.js').compareVersions;  

var message, warning, error, suggestion, example;

exports.envReady = function(cmd, next) {
  if (root === undefined || ecosystem !== undefined) {
    if (root === undefined) {
      message = 'It\'s seems that you have not setup NECO_ROOT environment variable!';
      suggestion = 'add \'export NECO_ROOT=<path>\' into your shell config file.';
      log('message', message, suggestion);
    } else if (root !== undefined && ecosystem !== undefined) {
      if (cmd === 'create') {
        warning = 'It\'s seems that you are alreay in a node ecosystem.';
        suggestion = 'First, deactivate existing ecosystem, then create new one.';
        example = 'neco_deactivate'; 
        log('warning', warning, suggestion, example);
      } else {
        next();
      }
    }
  } else {
    next();
  }
};

exports.rootReady = function(next) {
  var workDir = path.join(workroot, '.neco');
  path.exists(workDir, function(exists) {
    if (!exists) {
      fs.mkdir(workDir, mode=0777, function(err) {
        if (err) {throw err;}
        next();
      });
    } else {
      next();
    }
  });
};

exports.recordReady = function(cmd, next) {
  path.exists(recordFile, function(exists) {
    if (!exists) {
      if (cmd !== 'create') {
        message = 'You have not create any node ecosystem yet.';
        suggestion = 'Use create command to create first one!';
        example = 'nc create <id> [stable, latest, node-version]';
        log('message', message, suggestion, example);
      } else {
        next(exists);
      }
    } else {
      ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
      if (ecosystems.length === 0) {
        message = 'You have not create any node ecosystem yet.';
        suggestion = 'Use create command to create first one!';
        example = 'nc create <id> [stable, latest, node-version]';
        log('message', message, suggestion, example);     
      } else {
        process.config.idLenStandard = findlongestID(config); 
        next(exists);
      }
    }
  });
};

exports.upgradeReady = function(next) {
  var pkgVer, globalVer;
  path.exists(globalConfigFile, function(exists) {
    if (!exists) {
      copyFile(pkgConfigFile, globalConfigFile);
      copyFile(pkgActivateFile, globalActivateFile);
      copyFile(pkgDistFile, globalDistFile);
    } else {
      pkgVer = JSON.parse(fs.readFileSync(pkgConfigFile,'utf8')).version;
      globalVer = JSON.parse(fs.readFileSync(globalConfigFile,'utf8')).version;

      if (isBigger(pkgVer, globalVer) > 0) {
        copyFile(pkgConfigFile, globalConfigFile);
        copyFile(pkgActivateFile, globalActivateFile);
        copyFile(pkgDistFile, globalDistFile);
      }
    }

    next();
  });
}
