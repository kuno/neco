var os = require('os'),
fs = require('fs'),
path = require('path'),
log  = require('./display.js').log,
idLenStandard = require('../include/default.js').idLenStandard,
verLenStandard = require('../include/default.js').verLenStandard,
linkLenStandard = require('../include/default.js').linkLenStandard,
sizeLenStandard = require('../include/default.js').sizeLenStandard,
spareGlobalProperties = require('../include/default.js').spareGlobalProperties,
spareEcosystemProperties = require('../include/default.js').spareEcosystemProperties;

var message, warning, error, suggestion, example;

exports.compareVersions = function(versionA, versionB) {
  var arrayA = versionA.split('-'), arrayB = versionB.split('-'),
  mainA = arrayA[0].split('.'), mainB = arrayB[0].split('.'), notSmaller,
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
        } else {
          if (parseInt(arrayA[-1], 10) < parseInt(arrayB[-1], 10)) {
            notSmaller = -1;
            break;
          } else if (parseInt(arrayA[-1], 10) > parseInt(arrayB[-1], 10)) {
            notSmaller = 1;
            break;
          } else {
            notSmaller = 0;
          }
        }
      }
      else {
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
  var index;
  ecosystems.forEach(function(e) {
    if (e.id !== id) {
      index = ecosystems.indexOf(e);
      ecosystems.splice(index, 1);
    }
  });

  return ecosystems;
};
