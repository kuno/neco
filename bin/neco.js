#!/usr/bin/env node

require.paths.shift('../deps');

// Set global varialbles namae space;
process.neco = {};

var path                 = require('path'),
    spawn                = require('child_process').spawn;

var list                 = require('../lib/command/list.js'),
    find                 = require('../lib/command/find.js'),
    howto                = require('../lib/command/howto.js'),
    update               = require('../lib/command/update.js'),
    create               = require('../lib/command/create.js'),
    remove               = require('../lib/command/remove.js'),
    option               = require('../lib/command/option.js'),
    activate             = require('../lib/command/activate.js'),
    deactivate           = require('../lib/command/deactivate.js'),
    completion           = require('../lib/command/completion.js');

var exit                 = require('../lib/exit.js').exit;

var handle               = require('../lib/exception.js').handle;

var filterConfig         = require('../lib/config.js').filterConfig,
    parseUserConfig      = require('../lib/config.js').parseUserConfig,
    parseGlobalConfig    = require('../lib/config.js').parseGlobalConfig,
    parseEcosystemConfig = require('../lib/config.js').parseEcosystemConfig;

var envReady             = require('../lib/inception.js').envReady,
    argvReady            = require('../lib/inception.js').argvReady,
    toolReady            = require('../lib/inception.js').toolReady,
    rootReady            = require('../lib/inception.js').rootReady,
    configReady          = require('../lib/inception.js').configReady,
    recordReady          = require('../lib/inception.js').recordReady,
    upgradeReady         = require('../lib/inception.js').upgradeReady;

var idUnique             = require('../lib/validation.js').idUnique,
    idExsit              = require('../lib/validation.js').idExsit,
    idValid              = require('../lib/validation.js').idValid,
    cliValid             = require('../lib/validation.js').cliValid,
    getAllCmd            = require('../lib/assistant.js').getAllCmd,
    releaseExist         = require('../lib/assistant.js').getRelease,
    ecosystemExist       = require('../lib/assistant.js').getEcosystem,
    ecosystemActive      = require('../lib/validation.js').ecosystemActive;

var log = require('../lib/display.js').log;  
var message, warning, error, suggestion, example;

var config, autoUpdate, argv;

// Try catch all errors
process.on('uncaughtException', function(err) {
  handle.emit('error', err);
});   

argvReady(function() {
    argv = process.neco.argv;

if (argv.cmd === undefined) {
  message = 'Missing command';
  suggestion = 'Available commands: ' + getAllCmd();
  example = 'neco howto, neco create <id>, neco list';
  log.emit('exit', message, suggestion, example);
} else if (!cliValid(argv.cmd)) {
  message = 'Not a valid command';
  suggestion = 'Available commands: ' + getAllCmd();
  example = 'neco hwoto, neco create <id>, neco list';
  log.emit('exit', message, suggestion, example);
} else {
  parseGlobalConfig(function() {parseUserConfig(function() {
    envReady(argv.cmd, function() {toolReady(function() { 
      rootReady(function() {configReady(function() {
        upgradeReady(function() {

          // Automatic update local dist file
          config = process.neco.config,
          script = path.join(config.pkgJSDir, 'update.js'),
          autoUpdate = spawn('node', [script]);
          autoUpdate.on('exit', function(code) {
           // Do nothing
          });
          // End of update

        // Subcommand create
        if (argv.cmd === 'create') {
          if (!argv.id) {
            message = 'Missing ID';
            suggestion = 'Please specific at least one ID (and the version of node, if you will).';
            example = 'neco create <id> [stable, unstable, version]';
            log.emit('exit', message, suggestion, example);
          } else {
              recordReady(argv.cmd, function(exists) {
                if (!exists) {
                  create.ru (argv);
                } else {
                  if (!idValid(argv.id)) {
                    message = 'The given id '+argv.id+' is one of the reserved words in neco.';
                    suggestion = 'Please choose another one.';
                    log.emit('exit', message, suggestion);
                  } else if (!idUnique(argv.id)) {
                    message = 'The given id '+argv.id+' has already been used.';
                    suggestion = 'Please choose another one instead.';
                    log.emit('message', message, suggestion);
                  } else { 
                    create.run(argv);
                  }
                }
              });
          }
        }

        // Command line optioins
        else if (argv.cmd[0] == '-') {
          option.run(argv);
        }

        // Subcommand list
        else if (argv.cmd === 'list') {
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
                list.run(argv)
              }
            });
        }


        // Subcommand update
        else if (argv.cmd === 'update') {
            update.run(argv);
        }

        // Subcommand find
        else if (argv.cmd === 'find') {
            recordReady(argv.cmd, function(exists) {    
              if (argv.target) {
                if (releaseExist(argv.target)) {
                  find.run(argv);
                } else {
                  message = 'The desired release '+argv.target+' is not available.';
                  suggestion = 'Find out all the available releases.';
                  example = 'neco find [stable, unstable, node-version]';
                  log.emit('exit', message, suggestion, example);
                }
              } else {
                find.run(argv);
              }
            });
        }

        // Subcommand howto
        else if (argv.cmd === 'howto') {
            howto.run(argv);
        }

        // Subcommand completion
        else if (argv.cmd === 'completion') {
              completion.run(argv);
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

        });
      });});
    });});
  });});
}
});
