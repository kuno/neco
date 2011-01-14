var fs = require('fs'),
path = require('path'),
log = require('./display.js').log,
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
ecosystem = process.env.NODE_ECOSYSTEM,
recordFile = path.join(root, '.neco', 'record.json'),
pkgActivateFile = path.join(pkgDir, 'shell/activate.sh'),
globalActivateFile = path.join(root, '.neco', 'activate.sh');

var message, warning, error, suggestion, example;

exports.envReady = function(config, next) {
  var root = config.root, ecosystem = config.ecosystem, cmd = config.cmd;
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
        next(cmd);
      }
    }
  } else {
    next(cmd);
  }
};

exports.recordReady = function(config, next) {
  var cmd = config.cmd, recordFile = config.recordFile;
  path.exists(recordFile, function(exists) {
    if (!exists && cmd !== 'create') {
      message = 'You have not create any node ecosystem yet.';
      suggestion = 'Use create command to create first one!';
      example = 'nc create <id> [stable, latest, node-version]';
      log('message', message, suggestion, example);
    } else {
      next(exists);
    }
  });
};

exports.activateReady = function(config, next) {
  var globalActivateFile = config.globalActivateFile,
  pkgActivateFile = config.pkgActivateFile;
  path.exists(globalActivateFile, function(exists) {
    if (!exists) {
      fs.readFile(pkgActivateFile, 'utf8', function(err, data) {
        if (err) {throw err;}
        fs.writeFile(globalActivateFile, data, 'utf8', function(err) {
          if (err) {throw err;}
          next(cmd);
        });
      });
    } else {
      next(cmd);
    }
  });
};
