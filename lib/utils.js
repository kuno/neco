var os = require('os'),
fs = require('fs'),
path = require('path'),
log  = require('./display.js').log,
idLenStandard = require('../include/settings.js').idLenStandard,
verLenStandard = require('../include/settings.js').verLenStandard,
linkLenStandard = require('../include/settings.js').linkLenStandard,
sizeLenStandard = require('../include/settings.js').sizeLenStandard,
npmVerLenStandard = require('../include/settings.js').npmVerLenStandard,
spareGlobalProperties = require('../include/settings.js').sgps,
spareEcosystemProperties = require('../include/settings.js').seps;

var message, warning, error, suggestion, example;

exports.compareVersions = function(versionA, versionB) {
  var notSmaller, arrayA = versionA.split('-'), arrayB = versionB.split('-'), 
  minorA, minorB, mainA = arrayA[0].split('.'), mainB = arrayB[0].split('.'), 
  len = (mainA.length <= mainB.length) ? mainA.length : mainB.length;

  for (var i = 0; i < len; ++i) {
    if (parseInt(mainA[i], 10) < parseInt(mainB[i], 10)) {
      notSmaller = -1;
      break;
    } else if (parseInt(mainA[i], 10) > parseInt(mainB[i], 10)) {
      notSmaller = 1;
      break;
    } else if (i === len - 1) {
      if (mainA.length > mainB.length) {
        notSmaller = 1;
      } else if (mainA.length === mainB.length) {
        if (arrayA.length === arrayB.length === 1) {
          notSmaller = 0;
        } else if (arrayA.length > arrayB.length) {
          notSmaller = 1;
        } else if (arrayA.length < arrayA.length) {
          notSmaller = -1;
        } else {
          minorA = arrayA.reverse()[0].replace(/[a-zA-Z]+/,'');
          minorB = arrayB.reverse()[0].replace(/[a-zA-Z]+/,'');
          if (minorA.length !== minorB.length) {
            notSmaller = ((minorA.length - minorB.length) > 0) ? 1 : -1; 
          } else if  (parseInt(minorA, 10) === parseInt(minorB, 10)) {
            notSmaller = 0;
          } else if (parseInt(minorA, 10) > parseInt(minorB, 10)) {
            notSmaller = 1;
          } else if (parseInt(minorA, 10) < parseInt(minorB, 10)) {
            notSmaller = -1;
          }
        }
      } else {
        notSmaller = -1;
      }
    }
  }

  return notSmaller;    
};

exports.normalizeValue = function(value) {
  var normalValue;

  if (value === 'true') {
    normalValue = true;
  } else if (value === 'false') {
    normalValue = false;
  } else if (!value.match(/[a-z][A-Z]/)) {
    normalValue = parseInt(value, 10);
  } else {
    normalValue = value;
  }

  return normalValue;
};

exports.toMB = function(size) {
  return ((parseInt(size, 10)/1024/1024).toFixed(2).toString()+'MB');
};

exports.fillSpace = function(type, string, length) {
  var i, gap, standard;

  if (type === 'id') {
    standard = length || idLenStandard;
  } else if (type === 'version') {
    standard = length || verLenStandard;
  } else if (type === 'link') {
    standard = length || linkLenStandard;
  } else if (type === 'size') {
    standard = length || sizeLenStandard;
  } else if (type === 'npm') {
    standard = length || npmVerLenStandard;
  } else {
    standard = 18;
  }

  if (string.length < standard) {
    gap = standard - string.length;
    for (i = 0; i < gap; ++i) {
      string += (' ');
    }
  }

  return string;
};

exports.cleanGloalConfig = function(config) {
  spareGlobalProperties.forEach(function(p) {
    delete config[p];
  });

  return config;
};

exports.cleanEcosystemConfig = function(config) {
  spareEcosystemProperties.forEach(function(p) {
    delete config[p];
  });

  return config;
};

exports.removeEcosystem = function(ecosystems, id) {
  var newEcosystems = [];
  ecosystems.forEach(function(e) {
    if (e.id !== id) {
      newEcosystems = newEcosystems.concat(e);
    }
  });

  return newEcosystems;
};

exports.copyFile = function(source, dest) {
  fs.readFile(source, 'utf8', function(err, data) {
    if (err) {throw err;}
    fs.writeFile(dest, data, 'utf8', function(err) {
      if (err) {throw err;}
    });
  });
};
