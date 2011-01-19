#!/usr/bin/env node

var list = require('../cmd/list.js'),
find = require('../cmd/find.js'),
howto = require('../cmd/howto.js'),
create = require('../cmd/create.js'),
remove = require('../cmd/remove.js'),
activate = require('../cmd/activate.js'),
deactivate = require('../cmd/deactivate.js');

var parsePkgConfig = require('../lib/config.js').parsePkgConfig, 
parseUserConfig = require('../lib/config.js').parseUserConfig,
parseGlobalConfig = require('../lib/config.js').parseGlobalConfig,
parseEcosystemConfig = require('../lib/config.js').parseEcosystemConfig; 

var envReady = require('../lib/inception.js').envReady,
rootReady = require('../lib/inception.js').rootReady,
recordReady = require('../lib/inception.js').recordReady,
activateReady = require('../lib/inception.js').activateReady;  

var idUnique = require('../lib/validation.js').idUnique,
idExsit = require('../lib/validation.js').idExsit,
idValid = require('../lib/validation.js').idValid,
cmdValid = require('../lib/validation.js').cmdValid,
ecosystemActive = require('../lib/validation.js').ecosystemActive,
releaseExist = require('../lib/assistant.js').getRelease,
ecosystemExist = require('../lib/assistant.js').getEcosystem;

var log = require('../lib/display.js').log;  
var message, warning, error, suggestion, example;

var argv = process.argv, id, target, cmd = argv[2];

if (cmd === undefined) {
  error = 'Missing command';
  suggestion = 'Available commands: howto, create, remove, list, find, activate, deactivate';
  example = 'neco howto, neco create <id>, neco list';
  log('error', error, suggestion, example);

} else if (!cmdValid(cmd)) {
  error = 'Not a valid command';
  suggestion = 'Available commands: howto, create, remove, list, find, activate, deactivate';
  example = 'neco hwoto, neco create <id>, neco list';
  log('error', error, suggestion, example);
} else {
  parseGlobalConfig(function() { parsePkgConfig(function() {
    parseUserConfig(function() {envReady(cmd, function() {
      rootReady(function() { activateReady(function() {   
        // Subcommand create
        if (cmd === 'create') {
          if (argv.length < 4) {
            message = 'Missing ID';
            suggestion = 'Please specific at least one ID( and the version of node, if you will).';
            example = 'neco create <id> [stable, latest, node-version]';
            log('message', message, suggestion, example);
          } else {
            id = argv[3], target = argv[4] || 'stable'; // defaut target is stable
            recordReady(cmd, function(exists) {
              if (!exists) {
                create.run(id, target);
              } else {
                if (!idValid(id)) {
                  message = 'The given id '+id+' is one of the reserved words in neco.';
                  suggestion = 'Please choose another one.';
                  log('message', message, suggestion);
                } else if (!idUnique(id)) {
                  message = 'The given id '+id+' has already been used.';
                  suggestion = 'Please choose another one instead.';
                  log('message', message, suggestion);
                } else { 
                  create.run(id ,target);
                }
              }
            });
          }
        }

        // Subcommand list
        else if (cmd === 'list') {
          recordReady(cmd, function(exists) {
            if (argv.length >= 4) {
              id = argv[3];
              if (ecosystemExist(id)) {
                list.run(id);
              } else {
                error = 'The desired ecosystem '+id+' is not exists.';
                suggestion = 'Find out all the existing ecosystem.';
                example = 'neco list';
                log('error', error, suggestion, example);
              }
            } else {
              list.run()
            }
          });
        }

        // Subcommand find
        else if (cmd === 'find') {
          recordReady(cmd, function(exists) {    
            if (argv.length >= 4) {
              target = argv[3];
              if (releaseExist(target)) {
                find.run(target);
              } else {
                error = 'The desired release '+target+' is not available.';
                suggestion = 'Find out all the available releases.';
                example = 'neco find [stable, latest, node-version]';
                log('error', error, suggestion, example);
              }
            } else {
              find.run();
            }
          });
        }

        // Subcommand help
        else if (cmd === 'howto') {
          howto.run(config);
        }

        // Subcommand activate
        else if (cmd === 'activate') {
          if (argv.length < 4) {
            message = 'Missing ID';
            suggestion = 'Please specify the id of the ecosystem you want to activate.';
            example = 'neco activate <id>';
            log('message', message, suggestion, example);
          } else {
            id = process.argv[3];
            parseEcosystemConfig(id, function() {
              recordReady(cmd, function(exists) {
                if (ecosystemActive(config)) {
                  warning = 'The node ecosystem with id '+id+' is already active.';
                  suggstion = 'Please use type deact in your shell to deactivate it.';
                  log('warning', warning, suggestion, example);
                } else if (!idExsit(id)) {
                  warning = 'The node ecosystem with id '+id+' is not exists.';
                  suggestion = 'You can use neco list command to find out all existing ecosystem.';
                  example = 'neco create <id> [node-version]';
                  log('warning', warning, suggestion, example);
                } else {
                  activate.run(id);
                }
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
            parseEcosystemConfig(id, function() {
              recordReady(cmd, function(exists) {
                if (!idExsit(id)) {
                  error = 'The node ecosystem with id '+id+' is not exists.';
                  suggestion = 'You can use neco list command to find out all existing ecosystem.';
                  example = 'neco list';
                  log('error', error, suggestion, example);
                } else if (!ecosystemActive(id)) {
                  error = 'The node ecosystem with id '+id+' is not active.';
                  suggestion = 'Use neco activate command to activate it first.';
                  example = 'neco_activate '+ id;
                  log('error', error, suggestion, example);
                } else { 
                  deactivate.run(id);
                }
              });
            });
          }
        }

        // Subcommand remove
        else  if (cmd === 'remove') {
          if (argv.length < 4) {
            message = 'Missing ID';
            suggestion = 'Please specific the ID of the ecosystem that you want to remove.';
            example = 'neco remove <id>';
            log('message', message, suggestion, example);
          } else {
            id = argv[3];
            parseEcosystemConfig(id, function() {
              recordReady(cmd, function(exists) {
                if (!idExsit(id)) {
                  message = 'The given id '+id+' is not exist.';
                  suggestion = 'Find out all existing ecosystem.';
                  example = 'neco list'
                  log('message', message, suggestion, example);
                } else if (ecosystemActive(id)) {
                  message = 'The given ecosystem with id '+id+' is in active.';
                  suggestion = 'Please deactivate it first.';
                  example = 'neco_deactivate'
                  log('message', message, suggestion, example);
                } else { 
                  remove.run(id);
                }
              });
            });
          }
        }


      });});
    });});
  });});
}
