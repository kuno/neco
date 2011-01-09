#!/usr/bin/env node

var list = require('../cmd/list.js'),
find = require('../cmd/find.js'),
help = require('../cmd/help.js'),
create = require('../cmd/create.js'),
activate = require('../cmd/activate.js'),
deactivate = require('../cmd/deactivate.js');

var isIDUnique = require('../lib/checker.js').isIDUnique,
isIDExsit = require('../lib/checker.js').isIDExsit,
isIDValid = require('../lib/checker.js').isIDValid,
isCMDValid = require('../lib/checker.js').isCMDValid,
isActive = require('../lib/checker.js').isActive,
getRelease = require('../lib/assistant.js').getRelease,
isEcosystemExist = require('../lib/assistant.js').getEcosystem,
getconfig = require('../lib/config.js').getConfiguration;

var envReady = require('../lib/inception.js').envReady,
recordReady = require('../lib/inception.js').recordReady,
activateReady = require('../lib/inception.js').activateReady;

var log = require('../lib/display.js').log;  
var message, warning, error, suggestion, example;  

var config = getconfig(), 
argv = process.argv, id, target, cmd = argv[2];

if (isCMDValid(cmd) === false) {
  message = 'Not a valid command';
  suggestion = 'Available commands: help, create, list, find, activate, deactivate';
  example = 'neco create <id>, neco list';
  log('message', message, suggestion, example);
} else {
  // Subcommand create
  if (cmd === 'create') {
    if (argv.length < 4) {
      message = 'Missing ID';
      suggestion = 'Please specific at least one ID( and the version of node, if you will).';
      example = 'neco create <id> [stable, latest, node-version]';
      log('message', message, suggestion, example);
    } else {
      id = argv[3], target = argv[4] || 'stable'; // defaut target is stable 
      cfg.id = id, cfg.cmd = cmd, cfg.target = target;
      envReady(config, function(cfg) {
        activateReady(cfg, function(cfg) {
          recordReady(cfg, function(exists, cfg) {  
            if (isIDValid(cfg) === false) {
              message = 'The given id '+id+' is one of the reserved words in neco.';
              suggestion = 'Please choose another one.';
              log('message', message, suggestion);
            } else {
              if (!exists) {
                create.run(cfg);
              } else {  
                if (isIDUnique(cfg) === false) {
                  message = 'The given id '+cfg.id+' has already been used.';
                  suggestion = 'Please choose another one instead.';
                  log('message', message, suggestion);
                } else {
                  create.run(cfg);
                }
              }
            }
          });
        });
      });
    }
  }

  // Subcommand list
  else if (cmd === 'list') {
    envReady(config, function(cfg) {
      activateReady(cfg, function(cfg) {
        recordReady(cfg, function(exists, cfg) {
          if (exists) {
            cfg.cmd = cmd;
            if (argv.length >= 4) {
              target = argv[3];
              cfg.target = target;
              if (isEcosystemExist(cfg)) {
                list.run(cfg);
              } else {
                error = 'The desired ecosystem '+target+' is not exists.';
                suggestion = 'Find out all the existing ecosystem.';
                example = 'neco list';
                log('error', error, suggestion, example);
              }
            } else {
              list.run(cfg);
            }
          }
        });
      });
    });
  }

  // Subcommand find
  else if (cmd === 'find') {
    envReady(config, function(cfg) {
      activateReady(cfg, function(cfg) {
        recordReady(cfg, function(exists, cfg) {
          cfg.cmd = cmd;
          if (argv.length >= 4) {
            target = argv[3];
            cfg.target = target;
            if (getRelease(cfg)) {
              find.run(cfg);
            } else {
              error = 'The desired release '+target+' is not available.';
              suggestion = 'Find out all the aviable releases.';
              example = 'neco find [stable, latest, node-version]';
              log('error', error, suggestion, example);
            }
          } else {
            find.run(cfg);
          }
        });
      });
    });
  }

  // Subcommand help
  else if (cmd === 'help') {
    help.run(config);
  }

  // Subcommand activate
  else if (cmd === 'activate') {
    envReady(config, function(cfg) {
      activateReady(cfg, function(cfg) {
        recordReady(cfg, function(exists, cfg) {
          if (exists) {
            if (argv.length < 4) {
              message = 'Missing ID';
              suggestion = 'Please specify the id of the ecosystem you want to activate.';
              example = 'neco activate <id>';
              log('message', message, suggestion, example);
            } else {
              id = process.argv[3];
              cfg.id = id;
              cfg.cmd = cmd;

              if (isActive(cfg) === true) {
                warning = 'The node ecosystem with id '+id+' is already active.';
                suggstion = 'Please use type deact in your shell to deactivate it.';
                log('warning', warning, suggestion, example);
              } else if (isIDExsit(cfg) == false) {
                warning = 'The node ecosystem with id '+id+' is not exists.';
                suggestion = 'You can use neco list command to find out all existing ecosystem.';
                example = 'neco create <id> [node-version]';
                log('warning', warning, suggestion, example);
              } else {
                activate.run(cfg);
              }
            }
          }
        });
      });
    });
  }

  // Subcommand deactvate
  else if (cmd === 'deactivate') {
    envReady(config, function(cfg) {
      activateReady(cfg, function(cfg) {
        recordReady(cfg, function(exists, cfg) {
          if (exists) {
            if (argv.length >= 4) {
              id = argv[3];
              cfg.id = id;
              cfg.cmd = cmd;
              if (isActive(cfg) === false) {
                warning = 'The node ecosystem with id '+id+' is not active.';
                suggestion = 'Use neco activate command to activate one first.';
                example = 'neco activate <id>';
                log('warning', warning, suggestion, example);
              } else if (isIDExsit(cfg) == false) {
                warning = 'The node ecosystem with id '+id+' is not exists.';
                suggestion = 'You can use neco list command to find out all existing ecosystem.';
                example = 'neco list';
                log('warning', warning, suggestion, example);
              } else {
                deactivate.run(cfg);
              }
            }
            deactivate.run(cfg);
          }
        });
      });
    });
  }

  // Subcommand remove
  else if (cmd === 'remove') {
    envReady(config, function(cfg) {
      activateReady(cfg, function(cfg) {
        recordReady(cfg, function(exists, cfg) {
          if (exists) {
          }
        });
      });
    });
  }

}
