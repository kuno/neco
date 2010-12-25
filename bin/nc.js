#!/usr/bin/env node

var fs = require('fs'),
path = require('path'),
install = require('../cmd/init.js').install,
cmd_list = require('../include/default.js').cmd_list;

var date = new Date();

var cmd = process.argv[2];

if (cmd_list.indexOf(cmd)) {
  console.log('Command avialable: init, activate, delete');
} else {
  if (cmd === 'init') {
    console.log('install node');
    var id = process.argv[3];
    var target = process.argv[4] || 'stable';
    console.log(id + ' : ' + target);
    install(id, target);
  } else if (cmd === 'activate') {
  } else if (cmd === 'deactvate') {
  } else if (cmd === 'delete') {
  }
}
