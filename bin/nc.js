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

var virgin = require('../lib/utils.js').virgin,
inception = require('../lib/utils.js').inception;

var id, target, cmd = process.argv[2];
var message, suggestion, example, warning, error;

if (isCMDValid(cmd) === false) {
  message = 'Available commands:\nhelp, create, list, activate, deactivate';
  log('message', message);
} else {
  // Subcommand create
  if (cmd === 'create') {
    virgin(function() {
      inception(cmd, function(exists) {
        if (process.argv.length < 4) {
          message = 'Missing ID';
          suggestion = 'Please specific at least one ID( and the version of node, if you will).';
          example = 'nc create <ID> [NODE-VERSION]';
          log('message', message, suggestion, example, cmd);
        } else {
          id = process.argv[3];
          target = process.argv[4] || 'stable';

          if (isIDValid(id) === false) {
            message = 'The given id '+id+' is one of the reserved words in neco.';
            suggestion = 'Please choose another one.';
            log('message', message, suggestion, example, cmd);

          } else {
            if (!exists) {
              create.run(id, target);
            } else {  
              if (isIDUnique(id) === false) {
                message = 'The given id '+id+' has already been used.';
                suggestion = 'Please choose another one instead.';
                log('message', message, suggestion, example, cmd);
              } else {
                create.run(id, target);
              }
            }
          }
        }
      });
    });
  }

  // Subcommand list
  else if (cmd === 'list') {
    virgin(function() {
      inception(cmd, function(exists) {
        if (exists) {
          list.run();
        }
      });
    });
  }

  // Subcommand help
  else if (cmd === 'list') {
    help.run();
  }

  // Subcommand activate
  else if (cmd === 'activate') {
    virgin(function() {
      inception(cmd, function(exists) {
        if (exists) {
          if (process.argv.length < 4) {
            message = 'Missing ID';
            suggestion = 'Please specify the id of the ecosystem you want to activate.';
            log('message', message, suggestion, example, cmd);
          } else {
            id = process.argv[3];

            if (isActive(id) === true) {
              warning = 'The node ecosystem with id '+id+' is already active.';
              suggstion = 'Please use type deact in your shell to deactivate it.';
              log('warning', warning, suggestion, example, cmd);
            } else if (isIDExsit(id) == false) {
              warning = 'The node ecosystem with id '+id+' is not exists.';
              suggestion = 'You can use nc list command to find out all existing ecosystem.';
              log('warning', warning, suggestion, example, cmd);
            } else {
              activate.run(id);
            }
          }
        }
      });
    });
  }

  // Subcommand deactvate
  else if (cmd === 'deactivate') {
    virgin(function() {
      inception(cmd, function(exists) {
        if (exists) {
          if (process.argv.length < 4) {
            message = 'Missing ID';
            suggestion = 'Please specify the id of the ecosystem you want to activate.';
            log('message', message, suggestion, example, cmd);
          } else {
            id = process.argv[3];
            if (isActive(id) === false) {
              warning = 'The node ecosystem with id '+id+' is not active.';
              suggestion = 'Use nc activate command to activate one first.';
              log('warning', warning, suggestion, example, cmd);
            } else if (isIDExsit(id) == false) {
              warning = 'The node ecosystem with id '+id+' is not exists.';
              suggestion = 'You can use nc list command to find out all existing ecosystem.';
              log('warning', warning, suggestion, example, cmd);
            } else {
              deactivate.run(id);
            }
          }
        }
      });
    });
  }

  // Subcommand destory
  else if (cmd === 'destory') {
    virgin(function() {
      inception(cmd, function(exists) {
        if (exists) {
        }
      });
    });
  }

}
