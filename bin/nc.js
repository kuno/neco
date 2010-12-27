#!/usr/bin/env node

var list = require('../cmd/list.js').list,   
create = require('../cmd/create.js').create,
activate = require('../cmd/activate.js').activate,
deactivate = require('../cmd/deactivate.js').deactivate;

var isIDUnique = require('../lib/checker.js').isIDUnique,
isIDExsit = require('../lib/checker.js').isIDExsit,
isIDValid = require('../lib/checker.js').isIDValid,
isCMDValid = require('../lib/checker.js').isCMDValid,
isActive = require('../lib/checker.js').isActive;

var virgin = require('../lib/utils.js').virgin,
inception = require('../lib/utils.js').inception;

var id, target, cmd = process.argv[2]; 

console.log(__dirname)

if (isCMDValid(cmd) === false) {
  console.log('Command avialable: create, list, activate, deactvate');
} else {
  // Subcommand create
  if (cmd === 'create') {
    virgin(function() {
      inception(cmd, function(exists) {
        if (process.argv.length < 4) {
          console.log('Please specific an id and the version node, if you will.');
        } else {
          id = process.argv[3];
          target = process.argv[4] || 'stable';

          if (!exists) {
            create(id, target);
          } else {
            if (isIDValid(id) === false) {
              console.log('The given id '+id+' is reconserved word in neco.');
              console.log('Please choose another one.');
            } else if (isIDUnique(id) === false) {
              console.log('The given id '+id+' has already been used.'); 
            } else {
              create(id, target);
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
          list();
        }
      });
    });
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

            if (isActive(id) === 'true') {
              console.log('The node ecosystem with id '+id+'is already active.');
            } else {
              activate(id);
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
            } else {
              deactivate(id);
            }
          }
        }
      })
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
