#!/usr/bin/env node

var list = require('../cmd/list.js'),
find = require('../cmd/find.js'),
help = require('../cmd/help.js'),
create = require('../cmd/create.js'),
activate = require('../cmd/activate.js'),
deactivate = require('../cmd/deactivate.js');

var log = require('../lib/display.js').log;

var isIDUnique = require('../lib/checker.js').isIDUnique,
isIDExsit = require('../lib/checker.js').isIDExsit,
isIDValid = require('../lib/checker.js').isIDValid,
isCMDValid = require('../lib/checker.js').isCMDValid,
isActive = require('../lib/checker.js').isActive,
getRelease = require('../lib/assistant.js').getRelease;

var getConfiguration = require('../lib/config.js').getConfiguration, 
envReady = require('../lib/inception.js').envReady,
recordReady = require('../lib/inception.js').recordReady,
activateReady = require('../lib/inception.js').activateReady;

var configuration = getConfiguration(), id, cmd = process.argv[2];
var message, warning, error, suggestion, example;

if (isCMDValid(cmd) === false) {
  message = 'Not a valid command';
  suggestion = 'Available commands: help, create, list, find, activate, deactivate';
  example = 'neco create <id>, neco list';
  log('message', message, suggestion, example);
} else {
  // Subcommand create
  if (cmd === 'create') {
    envReady(configuration, function(config) {
      activateReady(config, function(config) {
        recordReady(config, function(exists, config) {
          if (process.argv.length < 4) {
            message = 'Missing ID';
            suggestion = 'Please specific at least one ID( and the version of node, if you will).';
            example = 'neco create <id> [stable, latest, node-version]';
            log('message', message, suggestion, example);
          } else {
            config.id = process.argv[3];
            config.cmd = cmd;
            config.target = process.argv[4] || 'stable';

            if (isIDValid(config) === false) {
              message = 'The given id '+config.id+' is one of the reserved words in neco.';
              suggestion = 'Please choose another one.';
              log('message', message, suggestion, example);

            } else {
              if (!exists) {
                create.run(config);
              } else {  
                if (isIDUnique(config) === false) {
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
    });
  }

  // Subcommand list
  else if (cmd === 'list') {
    envReady(configuration, function(config) {
      activateReady(config, function(config) {
        recordReady(config, function(exists, config) {
          if (exists) {
            config.cmd = cmd;
            if (process.argv.length >= 4) {
              config.target = process.argv[3];
              if (getEcosystem(config)) {
                list.run(config);
              } else {
                error = 'The desired ecosystem '+config.target+' is not exists.';
                suggestion = 'Find out all the existing ecosystem.';
                example = 'neco list';
                log('error', error, suggestion, example);
              }
            } else {
              list.run(config);
            }
          }
        });
      });
    });
  }

  // Subcommand find
  else if (cmd === 'find') {
    envReady(configuration, function(config) {
      activateReady(config, function(config) {
        recordReady(config, function(exists, config) {
          config.cmd = cmd;
          if (process.argv.length >= 4) {
            config.target = process.argv[3];
            if (getRelease(config)) {
              find.run(config);
            } else {
              error = 'The desired release '+config.target+' is not available.';
              suggestion = 'Find out all the aviable releases.';
              example = 'neco find [stable, latest, node-version]';
              log('error', error, suggestion, example);
            }
          } else {
            find.run(config);
          }
        });
      });
    });
  }

  // Subcommand help
  else if (cmd === 'help') {
    help.run(configuration);
  }

  // Subcommand activate
  else if (cmd === 'activate') {
    envReady(configuration, function(config) {
      activateReady(config, function(config) {
        recordReady(config, function(exists, config) {
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

              if (isActive(config) === true) {
                warning = 'The node ecosystem with id '+id+' is already active.';
                suggstion = 'Please use type deact in your shell to deactivate it.';
                log('warning', warning, suggestion, example);
              } else if (isIDExsit(config) == false) {
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
    });
  }

  // Subcommand deactvate
  else if (cmd === 'deactivate') {
    envReady(configuration, function(config) {
      activateReady(config, function(config) {
        recordReady(config, function(exists, config) {
          if (exists) {
            if (process.argv.length >= 4) {
              id = process.argv[3];
              config.id = id;
              config.cmd = cmd;
              if (isActive(config) === false) {
                warning = 'The node ecosystem with id '+id+' is not active.';
                suggestion = 'Use neco activate command to activate one first.';
                example = 'neco activate <id>';
                log('warning', warning, suggestion, example);
              } else if (isIDExsit(config) == false) {
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
    });
  }

  // Subcommand destory
  else if (cmd === 'remove') {
    envReady(configuration, function(config) {
      activateReady(config, function(config) {
        recordReady(config, function(exists, config) {
          if (exists) {
          }
        });
      });
    });
  }

}
