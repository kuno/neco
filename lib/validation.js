var fs = require('fs'),
path = require('path'),
cmdList = require('../include/meta.js').cmdList,
reservedWords = require('../include/meta.js').reservedWords;

exports.idUnique = function(id) {
  var unique = true, data, ecosystems,
  config = process.neco.config,  
  recordFile = config.recordFile;

  data = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  data.ecosystems.forEach(function(e) {
    if (e.id === id) {
      unique = false;
    }
  });
  return unique;
};

exports.idValid = function(id) {
  var valid = true;
  reservedWords.forEach(function(w) {
    if (w === id) {
      valid = false;
    }
  });
  return valid;
};

exports.cmdValid = function(cmd) {
  var valid = false;
  cmdList.forEach(function(c) {
    if (c === cmd) {
      valid = true;
    }
  });
  return valid;
};

exports.idExsit = function(id) {
  var exist = null, ecosystems, data,
  config = process.neco.config,  
  recordFile = config.recordFile;

  data = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  data.ecosystems.forEach(function(e) {
    if (e.id === id) {
      exist = true;
    }
  });
  return exist;
};

exports.ecosystemActive = function(id) {
  var basename,
  config = process.neco.config,  
  ecosystem = config.ecosystem;

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
