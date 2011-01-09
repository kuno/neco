var fs = require('fs'),
path = require('path'),
log = require('./display.js').log;

var message, warning, error, suggestion, example;

exports.envReady = function(config, next) {
  console.log(config.root);
  console.log(config.ecosystem);
  console.log(config.cmd);
  if (config.root === undefined || config.ecosystem !== undefined) {
    if (config.root === undefined) {
      message = 'It\'s seems that you have not setup NECO_ROOT environment variable!';
      suggestion = 'add \'export NECO_ROOT=<path>\' into your shell config file.';
      log('message', message, suggestion);
    } else if (config.root !== undefined && config.ecosystem !== undefined) {
      if (config.cmd === 'create') {
        warning = 'It\'s seems that you are alreay in a node ecosystem.';
        suggestion = 'First, deactivate existing ecosystem, then create new one.';
        example = 'neco_deactivate'; 
        log('warning', warning, suggestion, example);
      } else {
        next(config);
      }
    } else {
      next(config);
    }
  }
};

exports.recordReady = function(config, next) {
  path.exists(config.recordFile, function(exists) {
    if (!exists && config.cmd !== 'create') {
      message = 'You have not create any node ecosystem yet.';
      suggestion = 'Use create command to create first one!';
      example = 'nc create <id> [stable, latest, node-version]';
      log('message', message, suggestion, example);
    }
    next(exists, config);
  });
};

exports.activateReady = function(config, next) {
  var defaultActivateFile;
  path.exists(config.globalActivateFile, function(exists) {
    if (!exists) {
      defaultActivateFile = path.join(config.shellDir, 'activate.sh');
      fs.readFile(defaultActivateFile, 'utf8', function(err, data) {
        if (err) {throw err;}
        fs.writeFile(config.globalActivateFile, data, 'utf8', function(err) {
          if (err) {throw err;}
          next(config);
        });
      });
    } else {
      next(config);
    }
  });
};
