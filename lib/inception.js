var fs = require('fs'),
path = require('path'),
log = require('./display.js').log;

var message, warning, error, suggestion, example;

exports.envReady = function(cfg, next) {
  if (cfg.root === undefined || config.ecosystem !== undefined) {
    if (cfg.root === undefined) {
      message = 'It\'s seems that you have not setup NECO_ROOT environment variable!';
      suggestion = 'add \'export NECO_ROOT=<path>\' into your shell cfg file.';
      log('message', message, suggestion);
    } else if (cfg.ecosystem !== undefined) {
      if (cfg.cmd === 'create') {
        warning = 'It\'s seems that you are alreay in a node ecosystem.';
        suggestion = 'First, deactivate existing ecosystem, then create new one.';
        example = 'neco_deactivate'; 
        log('warning', warning, suggestion, example);
      } else {
        next(cfg);
      }
    } 
  } else {
    next(cfg);
  }
};

exports.recordReady = function(cfg, next) {
  path.exists(cfg.recordFile, function(exists) {
    if (!exists && cfg.cmd !== 'create') {
      message = 'You have not create any node ecosystem yet.';
      suggestion = 'Use create command to create first one!';
      example = 'nc create <id> [stable, latest, node-version]';
      log('message', message, suggestion, example);
    }
    next(exists, cfg);
  });
};

exports.activateReady = function(cfg, next) {
  var defaultActivateFile;
  path.exists(cfg.globalActivateFile, function(exists) {
    if (!exists) {
      defaultActivateFile = path.join(cfg.shellDir, 'activate.sh');
      fs.readFile(defaultActivateFile, 'utf8', function(err, data) {
        if (err) {throw err;}
        fs.writeFile(cfg.globalActivateFile, data, 'utf8', function(err) {
          if (err) {throw err;}
          next(cfg);
        });
      });
    } else {
      next(cfg);
    }
  });
};
