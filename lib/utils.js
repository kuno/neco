var os = require('os'),
fs = require('fs'),
path = require('path'),
log  = require('./display.js').log,
idLenStandard = require('../include/default.js').idLenStandard,
verLenStandard = require('../include/default.js').verLenStandard,
linkLenStandard = require('../include/default.js').linkLenStandard,
sizeLenStandard = require('../include/default.js').sizeLenStandard;

var message, warning, error, suggestion, example;

exports.compareVersions = function(versionA, versionB) {
  var a = versionA.split('.'), b = versionB.split('.'), notSmaller;
  var len = (a.length <= b.length) ? a.length : b.length;

  for (var i = 0; i < len; ++i) {
    if (parseInt(a[i], 10) < parseInt(b[i], 10)) {
      notSmaller = -1;
      break;
    } else if (parseInt(a[i], 10) > parseInt(b[i], 10)) {
      notSmaller = 1;
      break;
    } else if (i === len - 1) {
      if (a.length > b.length) {
        notSmaller = 1;
      } else if (a.length === b.length) {
        notSmaller = 0;
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

exports.fillSpace = function(type, string) {
  var i, gap, standard;

  if (type === 'id') {
    standard = idLenStandard;
  } else if (type === 'version') {
    standard = verLenStandard;
  } else if (type === 'link') {
    standard = linkLenStandard;
  } else if (type === 'size') {
    standard = sizeLenStandard;
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
