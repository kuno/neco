#!/usr/bin/env node

var list = require('../cmd/list.js').list,   
create = require('../cmd/create.js').create;

var isIDUnique = require('../lib/checker.js').isIDUnique,
isIDExsit = require('../lib/checker.js').isIDExsit,
isIDValid = require('../lib/checker.js').isIDValid,
isCMDValid = require('../lib/checker.js').isCMDValid,
inception = require('../lib/utils.js').inception;

var id, target, cmd = process.argv[2]; 

if (isCMDValid(cmd) === false) {
  console.log('Command avialable: create, list, activate, destory');
} else {
  // Subcommand create
  if (cmd === 'create') {
    inception(function() {
      if (process.argv.length < 4) {
        console.log('Please specific an id and the version node, if you will.');
      } else {
        id = process.argv[3];
        target = process.argv[4] || 'stable';

        if (isIDValid(id) === false) {
          console.log('The given id '+id+' is reconserved word in neco.');
          console.log('Please choose another one.');
        } else if (isIDUnique(id) === false) {
          console.log('The given id ' + id + ' has already been used.'); 
        } else {
          create(id, target);
        }
      }
    });
  }

  // Subcommand list
  else if (cmd === 'list') {
    inception(function() {
      list();
    });
  }

  // Subcommand activate
  else if (cmd === 'activate') {
    inception(function() {
      if (process.argv.length < 4) {
        console.log('Please specify the id of the ecosystem you want to activate.')
      } else {
        id = process.argv[3];
      }
    });
  } 

  // Subcommand deactvate
  else if (cmd === 'deactvate') {
    inception(function() {
    });
  } 

  // Subcommand destory
  else if (cmd === 'destory') {
    if (process.argv.length < 4) {
      console.log('Please specific at least one id.');
    } else {
      destory(id);
    }
  }
}
