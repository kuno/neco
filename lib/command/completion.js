/*
* neco completion -- prints all the available commands
*/
var log = require('../display.js').log,
    exit = require('../exit.js').exit,
    cmdList = require('../../include/meta.js').cmdList;

exports.run = function() {
  cmdList.forEach(function(c) {
      console.log(c);
    });
};
