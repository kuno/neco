var fs            = require('fs'),
    path          = require('path'),
    optList       = require('../include/meta.js').optList,
    cmdList       = require('../include/meta.js').cmdList,
    flagList      = require('../include/meta.js').flagList,
    resWords      = require('../include/meta.js').resWords;

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
  resWords.forEach(function(w) {
    if (w === id) {
      valid = false;
    }
  });
  return valid;
};

exports.cliValid = function(cli) {
  var valid = false;

  if (/^[\w]/.test(cli)) {
    cmdList.forEach(function(c) {
      if (c === cli) {
        valid = true;
      }
    });
  } else if (/^--/.test(cli)) {
    flagList.forEach(function(f) {
        if (f == cli) {
          valid = true;
        }
    });
  } else if (/^-/.test(cli)) {
    optList.forEach(function(o) {
      if (o === cli) {
        valid = true;
      }
    });
  }

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
