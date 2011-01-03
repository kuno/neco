#!/usr/bin/env node

var list = require('../cmd/list.js'),
help = require('../cmd/help.js'),
create = require('../cmd/create.js'),
activate = require('../cmd/activate.js'),
deactivate = require('../cmd/deactivate.js');

var log = require('../lib/console.js').log;

var isIDUnique = require('../lib/checker.js').isIDUnique,
isIDExsit = require('../lib/checker.js').isIDExsit,
isIDValid = require('../lib/checker.js').isIDValid,
isCMDValid = require('../lib/checker.js').isCMDValid,
isActive = require('../lib/checker.js').isActive;

var getConfig = require('../lib/config.js').getConfig, 
virgin = require('../lib/inception.js').virgin,
inception = require('../lib/inception.js').inception;

var config, id, cmd = process.argv[2];
var message, warning, error, suggestion, example;

if (isCMDValid(cmd) === false) {
  message = 'Missing command';
  suggestion = 'Available commands: help, create, list, activate, deactivate';
  example = 'neco create <id>, neco list';
  log('message', message, suggestion, example);
} else {
  // Subcommand create
  if (cmd === 'create') {
    virgin(config, function() {
      inception(config, function(exists, config) {
        if (process.argv.length < 4) {
          message = 'Missing ID';
          suggestion = 'Please specific at least one ID( and the version of node, if you will).';
          example = 'neco create <id> [NODE-VERSION]';
          log('message', message, suggestion, example);
        } else {
          config = getConfig(process.argv[3])
          config.id = process.argv[3];
          config.cmd = cmd;
          config.nodeVer = process.argv[4] || 'stable';

          if (isIDValid(config) === false) {
            message = 'The given id '+config.id+' is one of the reserved words in neco.';
            suggestion = 'Please choose another one.';
            log('message', message, suggestion, example);

          } else {
            if (!exists) {
              create.run(config.id, config.node);
            } else {  
              if (isIDUnique(config.id) === false) {
                message = 'The given id '+config.id+' has already been used.';
                suggestion = 'Please choose another one instead.';
                log('message', message, suggestion);
              } else {
                create.run(config);
              }
            }
          }
        }
      });
    });
  }

  // Subcommand list
  else if (cmd === 'list') {
    virgin(cmd, function() {
      inception(cmd, function(exists, config) {
        if (exists) {
          list.run();
        }
      });
    });
  }

  // Subcommand help
  else if (cmd === 'help') {
    help.run();
  }

  // Subcommand activate
  else if (cmd === 'activate') {
    virgin(cmd, function() {
      inception(cmd, function(exists, config) {
        if (exists) {
          if (process.argv.length < 4) {
            message = 'Missing ID';
            suggestion = 'Please specify the id of the ecosystem you want to activate.';
            example = 'neco activate <id>';
            log('message', message, suggestion, example);
          } else {
            id = process.argv[3];
            config.id = id;
            config.cmd = cmd;

            if (isActive(id) === true) {
              warning = 'The node ecosystem with id '+id+' is already active.';
              suggstion = 'Please use type deact in your shell to deactivate it.';
              log('warning', warning, suggestion, example);
            } else if (isIDExsit(id) == false) {
              warning = 'The node ecosystem with id '+id+' is not exists.';
              suggestion = 'You can use neco list command to find out all existing ecosystem.';
              example = 'neco create <id> [node-version]';
              log('warning', warning, suggestion, example);
            } else {
              activate.run(config);
            }
          }
        }
      });
    });
  }

  // Subcommand deactvate
  else if (cmd === 'deactivate') {
    virgin(cmd, function() {
      inception(cmd, function(exists, config) {
        if (exists) {
          if (process.argv.length >= 4) {
            id = process.argv[3];
            config.id = id;
            config.cmd = cmd;
            if (isActive(config.id) === false) {
              warning = 'The node ecosystem with id '+id+' is not active.';
              suggestion = 'Use neco activate command to activate one first.';
              example = 'neco activate <id>';
              log('warning', warning, suggestion, example);
            } else if (isIDExsit(config.id) == false) {
              warning = 'The node ecosystem with id '+id+' is not exists.';
              suggestion = 'You can use neco list command to find out all existing ecosystem.';
              example = 'neco list';
              log('warning', warning, suggestion, example);
            } else {
              deactivate.run(config);
            }
          }
          deactivate.run(config);
        }
      });
    });
  }

  // Subcommand destory
  else if (cmd === 'destory') {
    virgin(cmd, function() {
      inception(cmd, function(exists, config) {
        if (exists) {
        }
      });
    });
  }

}
