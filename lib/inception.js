var fs = require('fs'),
path = require('path'),
log = require('./console.js').log,
cmdList = require('../include/default.js').cmdList,
forbiddenWords = require('../include/default.js').forbiddenWords,
root = process.env.NECO_ROOT || process.env.HOME,
pkgDir = path.join(__dirname, '..'),
recordFile = path.join(root, '.neco/record.json');
var message, warning, error, suggestion, example;

exports.virgin = function(config, run) {
  if (process.env.NECO_ROOT === undefined) {
    message = 'It\'s seems that you have not setup NECO_ROOT environment viriable!';
    suggestion = 'add \'export NECO_ROOT=<path>\' into your shell config file.';
    log('message', message, suggestion);
  } else if (process.env.NODE_ECOSYSTEM !== undefined) {
    if (config.cmd === 'create') {
      warning = 'It\'s seems that you are alreay in a node ecosystem.';
      suggestion = 'First, back to normal state, then create new one.';
      example = 'neco deactivate'; 
      log('warning', warning, suggestion, example);
    } else {
      run(config);
    }
  } else {
    run(config);
  }
};

exports.inception = function(config, run) {
  var rf = recordFile;
  path.exists(rf, function(exists) {
    if (!exists && config.cmd !== 'create') {
      message = 'You have not create any node ecosystem yet.';
      suggestion = 'Use create command to create first one!';
      example = 'nc create <id> [node-version]';
      log('message', message, suggestion, example);
    }
    run(exists, config);
  });
};
