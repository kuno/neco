var fs = require('fs'),
path = require('path'),
cmdList = require('../include/default.js').cmdList,
forbiddenWords = require('../include/default.js').forbiddenWords,
root = process.env.NECO_ROOT,
recordFile = path.join(root, '.neco/record.json');

exports.isIDUnique = function(id) {
  var unique = true, ecosystems;

  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
  ecosystems.forEach(function(e) {
    if (e.id === id) {
      unique = false;
    }
  });
  return unique;
};

exports.isIDValid = function(id) {
  var valid = true;
  forbiddenWords.forEach(function(w) {
    if (w === id) {
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

exports.isIDExsit = function(id) {
  var exist = false, ecosystems;
  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
  ecosystems.forEach(function(e) {
    if (e.id === id) {
      exist = true;
    }
  });
  return exist;
};

exports.isActive = function(id) {
  var basename;
  if (process.env.NODE_ECOSYSTEM === undefined) {
    return false;
  } else {
    basename = path.basename(process.env.NODE_ECOSYSTEM);
    if (basename === id) {
      return true;
    } else {
      return false;
    }
  }
};
