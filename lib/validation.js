var fs = require('fs'),
path = require('path'),
cmdList = require('../include/default.js').cmdList,
reservedWords = require('../include/default.js').reservedWords;

exports.idUnique = function(config) {
  var unique = true, data, ecosystems, 
  recordFile = config.recordFile;
  data = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  data.ecosystems.forEach(function(e) {
    if (e.id === config.id) {
      unique = false;
    }
  });
  return unique;
};

exports.idValid = function(config) {
  var valid = true;
  reservedWords.forEach(function(w) {
    if (w === config.id) {
      valid = false;
    }
  });
  return valid;
};

exports.cmdValid = function(command) {
  var valid = false;
  cmdList.forEach(function(c) {
    if (c === command) {
      valid = true;
    }
  });
  return valid;
};

exports.idExsit = function(config) {
  console.log(config);
  var exist = null, ecosystems, data; 
  recordFile = config.recordFile;
  data = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  data.ecosystems.forEach(function(e) {
    if (e.id === config.id) {
      exist = true;
    }
  });
  return exist;
};

exports.ecosystemActive = function(config) {
  var basename, id = config.id, ecosystem = config.ecosystem;
  if (ecosystem === undefined) {
    return false;
  } else {
    basename = path.basename(ecosystem);
    if (basename === id) {
      return true;
    } else {
      return false;
    }
  }
};
