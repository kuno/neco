#!/usr/bin/env node

var list = require('../cmd/list.js'),
find = require('../cmd/find.js'),
howto = require('../cmd/howto.js'),
create = require('../cmd/create.js'),
remove = require('../cmd/remove.js'),
activate = require('../cmd/activate.js'),
deactivate = require('../cmd/deactivate.js');

var idUnique = require('../lib/validation.js').idUnique,
idExsit = require('../lib/validation.js').idExsit,
idValid = require('../lib/validation.js').idValid,
cmdValid = require('../lib/validation.js').cmdValid,
ecosystemActive = require('../lib/validation.js').ecosystemActive,
releaseExist = require('../lib/assistant.js').getRelease,
ecosystemExist = require('../lib/assistant.js').getEcosystem,
parseUserConfig = require('../lib/config.js').parseUserConfig,
parseGlobalConfig = require('../lib/config.js').parseGlobalConfig,
parseEcosystemConfig = require('../lib/config.js').parseEcosystemConfig,
getconfig = require('../lib/config.js').getConfig;

var envReady = require('../lib/inception.js').envReady,
recordReady = require('../lib/inception.js').recordReady,
activateReady = require('../lib/inception.js').activateReady;

var log = require('../lib/display.js').log;  
var message, warning, error, suggestion, example;

var argv = process.argv, id, target, cmd = argv[2];

if (cmdValid(cmd) === false) {
  message = 'Not a valid command';
  suggestion = 'Available commands: howto, create, list, find, activate, deactivate';
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
      parseGlobalConfig(function(config) {
        config.id = id, config.cmd = cmd, config.target = target; 
        parseUserConfig(config, function(config) {
          envReady(config, function(config) {
            activateReady(config, function(config) {
              recordReady(config, function(exists, config) {
                if (!exists) {
                  create.run(config);
                } else {
                  if (!idValid(config)) {
                    message = 'The given id '+id+' is one of the reserved words in neco.';
                    suggestion = 'Please choose another one.';
                    log('message', message, suggestion);
                  } else if (!idUnique(config)) {
                    message = 'The given id '+config.id+' has already been used.';
                    suggestion = 'Please choose another one instead.';
                    log('message', message, suggestion);
                  } else { 
                    create.run(config);
                  }
                }
              });
            });
          });
        });
      });
    }
  }

  // Subcommand list
  else if (cmd === 'list') {
    parseGlobalConfig(function(config) {
      console.log('parseGlobalConfig');
      /*
      config.cmd = cmd;
      parseUserConfig(config, function(config) {
        console.log('parseUserConfig');
        envReady(config, function(config) {
          console.log('envReady');
          activateReady(config, function(config) {
            console.log('activateReady');
            recordReady(config, function(exists, config) {
              console.log('recordReady');
              if (argv.length >= 4) {
                target = argv[3];
                config.target = target;  
                if (ecosystemExist(config)) {
                  console.log('ecosystem exists!');
               //   list.run(config);
                } else {
                  error = 'The desired ecosystem '+target+' is not exists.';
                  suggestion = 'Find out all the existing ecosystem.';
                  example = 'neco list';
                  log('error', error, suggestion, example);
                }
              } else {
                console.log(config);
               // list.run(config);
              }
            });
          });
        });
      });*/
    });
  }

  // Subcommand find
  else if (cmd === 'find') {
    parseGlobalConfig(function(config) {
      config.cmd = cmd;  
      parseUserConfig(config, function(config) {
        envReady(config, function(config) {
          activateReady(config, function(config) {
            recordReady(config, function(exists, config) {    
              if (argv.length >= 4) {
                target = argv[3];
                config.target = target;
                if (isReleaseExist(config)) {
                  find.run(config);
                } else {
                  error = 'The desired release '+target+' is not available.';
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
      });
    });
  }

  // Subcommand help
  else if (cmd === 'howto') {
    parseGlobalConfig(function(config) {
      parseUserConfig(config, function(config) {
        howto.run(config);
      });
    });
  }

  // Subcommand activate
  else if (cmd === 'activate') {
    if (argv.length < 4) {
      message = 'Missing ID';
      suggestion = 'Please specify the id of the ecosystem you want to activate.';
      example = 'neco_activate <id>';
      log('message', message, suggestion, example);
    } else {
      id = process.argv[3];

      parseGlobalConfig(function(config) {
        config.id = id, config.cmd = cmd;
        parseEcosystemConfig(config, function(config) {
          parseUserConfig(config, function(config) {
            envReady(config, function(config) {
              activateReady(config, function(config) {
                recordReady(config, function(exists, config) {
                  if (ecosystemActive(config)) {
                    warning = 'The node ecosystem with id '+id+' is already active.';
                    suggstion = 'Please use type deact in your shell to deactivate it.';
                    log('warning', warning, suggestion, example);
                  } else if (!idExsit(config)) {
                    warning = 'The node ecosystem with id '+id+' is not exists.';
                    suggestion = 'You can use neco list command to find out all existing ecosystem.';
                    example = 'neco create <id> [node-version]';
                    log('warning', warning, suggestion, example);
                  } else {
                    activate.run(config);
                  }
                });
              });
            });
          });
        });
      });
    }
  }

  // Subcommand deactvate
  else if (cmd === 'deactivate') {
    if (argv.length < 4) {
      message = 'Missing ID';
      suggestion = 'Please specify the id of the ecosystem you want to deactivate.';
      example = 'neco deactivate <id>';
      log('message', message, suggestion, example);
    } else {
      id = process.argv[3];
      parseGlobalConfig(function(config) {
        config.id = id, config.cmd = cmd;  
        parseEcosystemConfig(config, function(config) {
          parseUserConfig(config, function(config) {
            envReady(config, function(config) {
              activateReady(config, function(config) {
                recordReady(config, function(exists, config) {
                  if (!idExsit(config)) {
                    warning = 'The node ecosystem with id '+id+' is not exists.';
                    suggestion = 'You can use neco list command to find out all existing ecosystem.';
                    example = 'neco list';
                    log('warning', warning, suggestion, example);
                  } else if (!ecosystemActive(config)) {
                    warning = 'The node ecosystem with id '+id+' is not active.';
                    suggestion = 'Use neco activate command to activate it first.';
                    example = 'neco_activate '+ id;
                    log('warning', warning, suggestion, example);
                  } else { 
                    deactivate.run(config);
                  }
                });
              });
            });
          });
        });
      });
    }
  }

  // Subcommand remove
  else  if (cmd === 'remove') {
    if (argv.length < 4) {
      message = 'Missing ID';
      suggestion = 'Please specific the ID of the ecosystem that you want ot removed.';
      example = 'neco remove <id>';
      log('message', message, suggestion, example);
    } else {
      id = argv[3];
      parseGlobalConfig(function(config) {
        config.id = id, config.cmd = cmd;
        parseEcosystemConfig(config, function(config) {
          parseUserConfig(config, function(config) {
            envReady(config, function(config) {
              activateReady(config, function(config) {
                recordReady(config, function(exists, config) {
                  if (!idExsit(config)) {
                    message = 'The given id '+id+' is not exist.';
                    suggestion = 'Find out all existing ecosystem.';
                    example = 'neco list'
                    log('message', message, suggestion, example);
                  } else if (ecosystemActive(config)) {
                    message = 'The given ecosystem with id '+id+' is in active.';
                    suggestion = 'Please deactivate it first.';
                    example = 'neco_deactivate'
                    log('message', message, suggestion, example);
                  } else { 
                    remove.run(config);
                  }
                });
              });
            });
          });
        });
      });
    }
  }

}
