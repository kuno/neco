var fs = require('fs'),
path = require('path'),
cmdList = require('../include/default.js').cmdList,
reservedWords = require('../include/default.js').reservedWords;

exports.isIDUnique = function(config) {
  var unique = true, ecosystems;

  ecosystems = JSON.parse(fs.readFileSync(config.recordFile, 'utf8')).ecosystems;
  ecosystems.forEach(function(e) {
    if (e.id === config.id) {
      unique = false;
    }
  });
  return unique;
};

exports.isIDValid = function(config) {
  var valid = true;
  reservedWords.forEach(function(w) {
    if (w === config.id) {
      valid = false;
    }
  });
  return valid;
};

exports.isCMDValid = function(command) {
  var valid = false;
  cmdList.forEach(function(c) {
    if (c === command) {
      valid = true;
    }
  });
  return valid;
};

exports.isIDExsit = function(config) {
  var exist = false, ecosystems, recordFile = config.recordFile;
  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
  ecosystems.forEach(function(e) {
    console.log(e);
    if (e.id === config.id) {
      exist = true;
    }
  });
  return exists;
};

exports.isActive = function(config) {
  var basename;
  if (config.ecosystem === undefined) {
    return false;
  } else {
    basename = path.basename(config.ecosystem);
    if (basename === id) {
      return true;
    } else {
      return false;
    }
  }
};
