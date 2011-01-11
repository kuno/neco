var fs = require('fs'),
path = require('path'),
cmdList = require('../include/default.js').cmdList,
reservedWords = require('../include/default.js').reservedWords;

exports.idUnique = function(config) {
  var unique = true, ecosystems, recordFile = config.recordFile;

  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
  ecosystems.forEach(function(e) {
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
  var exist = null, ecosystems, recordFile = config.recordFile;
  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
  ecosystems.forEach(function(e) {
    if (e.id === config.id) {
      exist = true;
    }
  });
  return exist;
};

exports.ecosystemActive = function(config) {
  var basename, ecosystem = config.ecosystem;
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
