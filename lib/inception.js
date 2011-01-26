var fs = require('fs'),
path = require('path'),
log = require('./display.js').log,
copyFile = require('./utils.js').copyFile,
isBigger = require('./utils.js').compareVersions,
findlongestID = require('./assistant.js').findlongestID; 

var root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
ecosystem = process.env.NODE_ECOSYSTEM,
recordFile = path.join(root, '.neco/record.json'),
pkgDistFile = path.join(pkgDir, 'data/dist.json'),
pkgConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
pkgActivateFile = path.join(pkgDir, 'shell/activate.sh'),
localDistFile = path.join(root, '.neco/dist.json'),
localConfigFile = path.join(root, '.neco/config.json'),
localActivateFile = path.join(root, '.neco', 'activate.sh');

var message, warning, error, suggestion, example;

exports.toolReady = function(next) {
  var paths, error, missing = 0, count = 0, 
  tools = {download:['/usr/bin/wget', '/usr/bin/curl'],
  decompress:['/bin/tar'],
  sed:['/bin/sed'],
  make:['/usr/bin/make'],
  install:['/bin/install']};

  var keys = Object.keys(tools);
  keys.forEach(function(k) {
    paths = tools[k];
    count = toolPaths.length;
    toolPaths.forEach(function(p) { 
      if (!path.existsSync(p)) {
        missing += 1;
        if (missing === count) {
          err = new Error('Missing tool');
          log.emit('error', error);
        }
      }
    });
  });

  next();
};

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
  var workDir = path.join(root, '.neco');
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
        //process.config.idLenStandard = findlongestID(config); 
        next(exists);
      }
    }
  });
};

exports.upgradeReady = function(next) {
  var pkgVer, localVer;
  path.exists(localConfigFile, function(exists) {
    if (!exists) {
      copyFile(pkgConfigFile, localConfigFile);
      copyFile(pkgActivateFile, localActivateFile);
      copyFile(pkgDistFile, localDistFile);
    } else {
      pkgVer = JSON.parse(fs.readFileSync(pkgConfigFile,'utf8')).version;
      localVer = JSON.parse(fs.readFileSync(localConfigFile,'utf8')).version;

      if (isBigger(pkgVer, localVer) > 0) {
        copyFile(pkgConfigFile, localConfigFile);
        copyFile(pkgActivateFile, localActivateFile);
        copyFile(pkgDistFile, localDistFile);
      }
    }

    next();
  });
}
