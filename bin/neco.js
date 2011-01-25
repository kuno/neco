#!/usr/bin/env node

require.paths.shift('../deps');

var list = require('../cmd/list.js'),
find = require('../cmd/find.js'),
howto = require('../cmd/howto.js'),
create = require('../cmd/create.js'),
remove = require('../cmd/remove.js'),
activate = require('../cmd/activate.js'),
deactivate = require('../cmd/deactivate.js');

var filterConfig = require('../lib/config.js').filterConfig,
parseUserConfig = require('../lib/config.js').parseUserConfig,
parseGlobalConfig = require('../lib/config.js').parseGlobalConfig,
parseEcosystemConfig = require('../lib/config.js').parseEcosystemConfig; 

var envReady = require('../lib/inception.js').envReady,
rootReady = require('../lib/inception.js').rootReady,
recordReady = require('../lib/inception.js').recordReady,
upgradeReady = require('../lib/inception.js').upgradeReady;  

var parseArgv = require('../lib/parser.js').parseArgv;

var idUnique = require('../lib/validation.js').idUnique,
idExsit = require('../lib/validation.js').idExsit,
idValid = require('../lib/validation.js').idValid,
cmdValid = require('../lib/validation.js').cmdValid,
ecosystemActive = require('../lib/validation.js').ecosystemActive,
releaseExist = require('../lib/assistant.js').getRelease,
ecosystemExist = require('../lib/assistant.js').getEcosystem;

var log = require('../lib/display.js').log;  
var message, warning, error, suggestion, example;

var argv = parseArgv();
//var argv = process.argv, id, target, cmd = argv[2];

// Set global varialbles namae space;
process.neco = {};
// Try catch all errors
process.on('uncaughException', function(err) {
  log.emit('error', err);
});

if (argv.cmd === undefined) {
  message = 'Missing command';
  suggestion = 'Available commands: howto, create, remove, list, find, activate, deactivate';
  example = 'neco howto, neco create <id>, neco list';
  log.emit('exit', message, suggestion, example);
} else if (!cmdValid(argv.cmd)) {
  message = 'Not a valid command';
  suggestion = 'Available commands: howto, create, remove, list, find, activate, deactivate';
  example = 'neco hwoto, neco create <id>, neco list';
  log.emit('exit', message, suggestion, example);
} else {
  parseGlobalConfig(function() { parseUserConfig(function() {
    envReady(cmd, function() { rootReady(function() { 
      upgradeReady(function() {   
        // Subcommand create
        if (argv.cmd === 'create') {
          if (!argv.id) {
            message = 'Missing ID';
            suggestion = 'Please specific at least one ID( and the version of node, if you will).';
            example = 'neco create <id> [stable, latest, node-version]';
            log.emit('exit', message, suggestion, example);
          } else {
            filterConfig(function() {
              recordReady(argv.cmd, function(exists) {
                if (!exists) {
                  create.run(argv);
                } else {
                  if (!idValid(argv.id)) {
                    message = 'The given id '+argv.id+' is one of the reserved words in neco.';
                    suggestion = 'Please choose another one.';
                    log.emit('exit', message, suggestion);
                  } else if (!idUnique(argv.id)) {
                    message = 'The given id '+argv.id+' has already been used.';
                    suggestion = 'Please choose another one instead.';
                    log('message', message, suggestion);
                  } else { 
                    create.run(argv);
                  }
                }
              });
            });
          }
        }

        // Subcommand list
        else if (argv.cmd === 'list') {
          filterConfig(function() {
            recordReady(argv.cmd, function(exists) {
              if (argv.id) {
                if (ecosystemExist(argv.id)) {
                  list.run(argv);
                } else {
                  message = 'The desired ecosystem '+argv.id+' is not exists.';
                  suggestion = 'Find out all the existing ecosystem.';
                  example = 'neco list';
                  log.emit('exit', message, suggestion, example);
                }
              } else {
                list.run()
              }
            });
          });
        }

        // Subcommand find
        else if (argv.cmd === 'find') {
          filterConfig(function() {
            recordReady(argv.cmd, function(exists) {    
              if (argv.target) {
                if (releaseExist(argv.target)) {
                  find.run(argv);
                } else {
                  message = 'The desired release '+argv.target+' is not available.';
                  suggestion = 'Find out all the available releases.';
                  example = 'neco find [stable, latest, node-version]';
                  log.emit('exit', message, suggestion, example);
                }
              } else {
                find.run(argv);
              }
            });
          });
        }

        // Subcommand help
        else if (argv.cmd === 'howto') {
          filterConfig(function() {
            howto.run();
          });
        }

        // Subcommand activate
        else if (argv.cmd === 'activate') {
          if (!argv.id) {
            message = 'Missing ID';
            suggestion = 'Please specify the id of the ecosystem you want to activate.';
            example = 'neco activate <id>';
            log.emit('exit', message, suggestion, example);
          } else {
            parseEcosystemConfig(argv.id, function() {
              filterConfig(function() {
                recordReady(argv.cmd, function(exists) {
                  if (ecosystemActive(argv.id)) {
                    message = 'The node ecosystem with id '+argv.id+' is already active.';
                    suggstion = 'Please use type deact in your shell to deactivate it.';
                    log.emit('exit', message, suggestion, example);
                  } else if (!idExsit(argv.id)) {
                    messge = 'The node ecosystem with id '+argv.id+' is not exists.';
                    suggestion = 'You can use neco list command to find out all existing ecosystem.';
                    example = 'neco create <id> [node-version]';
                    log.emit('exit', message, suggestion, example);
                  } else {
                    activate.run(argv);
                  }
                });
              });
            });
          }
        }

        // Subcommand deactvate
        else if (argv.cmd === 'deactivate') {
          if (!argv.id) {
            message = 'Missing ID';
            suggestion = 'Please specify the id of the ecosystem you want to deactivate.';
            example = 'neco deactivate <id>';
            log.emit('exit', message, suggestion, example);
          } else {
            parseEcosystemConfig(argv.id, function() {
              filterConfig(function() {
                recordReady(argv.cmd, function(exists) {
                  if (!idExsit(argv.id)) {
                    message = 'The node ecosystem with id '+argv.id+' is not exists.';
                    suggestion = 'You can use neco list command to find out all existing ecosystem.';
                    example = 'neco list';
                    log.emit('exit', message, suggestion, example);
                  } else if (!ecosystemActive(argv.id)) {
                    message = 'The node ecosystem with id '+argv.id+' is not active.';
                    suggestion = 'Use neco activate command to activate it first.';
                    example = 'neco_activate '+ argv.id;
                    log.emit('exit', message, suggestion, example);
                  } else { 
                    deactivate.run(argv);
                  }
                });
              });
            });
          }
        }

        // Subcommand remove
        else  if (argv.cmd === 'remove') {
          if (!argv.id) {
            message = 'Missing ID';
            suggestion = 'Please specific the ID of the ecosystem that you want to remove.';
            example = 'neco remove <id>';
            log.emit('exit', message, suggestion, example);
          } else {
            parseEcosystemConfig(argv.id, function() {
              filterConfig(function() {
                recordReady(argv.cmd, function(exists) {
                  if (!idExsit(argv.id)) {
                    message = 'The given id '+argv.id+' is not exist.';
                    suggestion = 'Find out all existing ecosystem.';
                    example = 'neco list'
                    log.emit('exit', message, suggestion, example);
                  } else if (ecosystemActive(argv.id)) {
                    message = 'The given ecosystem with id '+argv.id+' is in active.';
                    suggestion = 'Please deactivate it first.';
                    example = 'neco_deactivate'
                    log.emit('exit', message, suggestion, example);
                  } else { 
                    remove.run(argv);
                  }
                });
              });
            });
          }
        }


      });});
    });});
  });
}
