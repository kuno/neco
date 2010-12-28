#!/usr/bin/env node

var list = require('../cmd/list.js'),
    help = require('../cmd/help.js'),
    create = require('../cmd/create.js'),
    activate = require('../cmd/activate.js'),
    deactivate = require('../cmd/deactivate.js');

var log = require('../lib/logger.js').log;

var isIDUnique = require('../lib/checker.js').isIDUnique,
    isIDExsit = require('../lib/checker.js').isIDExsit,
    isIDValid = require('../lib/checker.js').isIDValid,
    isCMDValid = require('../lib/checker.js').isCMDValid,
    isActive = require('../lib/checker.js').isActive;

var virgin = require('../lib/utils.js').virgin,
    inception = require('../lib/utils.js').inception;

var id, target, cmd = process.argv[2];
var infor, example;

if (isCMDValid(cmd) === false) {
  infor = 'Available commands:\nhelp, create, list, activate, deactivate';
} else {
  // Subcommand create
  if (cmd === 'create') {
    virgin(function() {
      inception(cmd, function(exists) {
        if (process.argv.length < 4) {
          infor = 'Missing id, please specific at least one ID( and the version of node, if you will).';
          example = 'nc create <NECO-ID> [NODE-VERSION]';
          log('message', infor, example, cmd);
        } else {
          id = process.argv[3];
          target = process.argv[4] || 'stable';

          if (!exists) {
            create.run(id, target);
          } else {
            if (isIDValid(id) === false) {
              console.log('The given id '+id+' is reconserved word in neco.');
              console.log('Please choose another one.');
            } else if (isIDUnique(id) === false) {
              console.log('The given id '+id+' has already been used.'); 
            } else {
              create.run(id, target);
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
            console.log('Please specify the id of the ecosystem you want to activate.')
          } else {
            id = process.argv[3];

            if (isActive(id) === true) {
              console.log('The node ecosystem with id '+id+' is already active.');
            } else if (isIDExsit(id) == false) {
              console.log('The node ecosystem with id '+id+' is not exists.');
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
            console.log('Please specify the id of the ecosystem you want to activate.')
          } else {
            id = process.argv[3];
            if (isActive(id) === false) {
              console.log('The node ecosystem with id '+id+' is not active.');
            } else if (isIDExsit(id) == false) {
              console.log('The node ecosystem with id '+id+' is not exists.');
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
