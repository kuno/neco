var fs = require('fs'),
path = require('path'),
cmdList = require('../include/default.js').cmdList,
log  = require('./console.js').log,
forbiddenWords = require('../include/default.js').forbiddenWords,
pkgDir = path.join(__dirname, '..'),
root = process.env.NECO_ROOT,
recordFile = path.join(root, '.neco/record.json');
var message, warning, error, suggestion, example;

exports.getRelease = function(target) {
  var dist, distPath,ver, release;
  distPath = path.join(__dirname, '../data/dist.json');
  dist = JSON.parse(fs.readFileSync(distPath, 'utf8'));

  if (!dist) {
    console.log('err');
  } else {
    if (target === 'stable') {
      ver = dist.stable;
    } else if (target === 'latest') {
      ver = dist.latest;
    } else {
      ver = target;
    }

    dist.history.forEach(function(r) {
      if (r.version === ver) {
        release = r;
      }
    });
  }

  if (release) {
    return release;
  } else {
    return null;
  }
};

exports.virgin = function(cmd, run) {
  if (process.env.NECO_ROOT === undefined) {
    message = 'It\'s seems that you have not setup NECO_ROOT environment viriable!';
    suggestion = 'add \'export NECO_ROOT=<path>\' into your shell config file.';
    log('message', message, suggestion);
  } else if (process.env.NODE_ECOSYSTEM !== undefined) {
    if (cmd === 'create') {
      warning = 'It\'s seems that you are alreay in a node ecosystem.';
      suggestion = 'First, back to normal state, then create new one.';
      example = 'nc deactivate'; 
      log('warning', warning, suggestion, example);
    } else {
      run();
    }
  } else {
    run();
  }
};

exports.inception = function(cmd, run) {
  var rf = recordFile;
  path.exists(rf, function(exists) {
    if (!exists) {
      message = 'You have not create any node ecosystem yet.';
      suggestion = 'Use create command to create first one!';
      example = 'nc create <id> [node-version]';
      log('message', message, suggestion, example);
    }
    run(exists);
  });
};

exports.compareNodeVersion = function(versionA, versionB) {
  var a = versionA.split('.'), b = versionB.split('.'), notSmaller;
  var len = (a.length <= b.length) ? a.length : b.length;
  
  for (var i = 0; i < len; ++i) {
    if (parseInt(a[i], 10) < parseInt(b[i], 10)) {
      notSmaller = false;
      break;
    } else if (parseInt(a[i], 10) > parseInt(b[i], 10)) {
      notSmaller = true;
      break;
    } else if (i === len - 1) {
      if (a.length >= b.length) {
        notSmaller = true;
      } else {
        notSmaller = false;
      }
    }
  }

  return notSmaller;
};

exports.getSuitedNPM = function(version) {
  var len, minima, npm = null;
  var target = version;
  var notSmaller = exports.compareNodeVersion;

  var dataFile = path.join(pkgDir, 'data/npm.json');
  var coulps = JSON.parse(fs.readFileSync(dataFile, 'utf8')).coulps;
  len = coulps.length;

  for (var i = 0; i < len; ++i) {
    minima = coulps[i].node;
    if (notSmaller(target, minima) === true) {
      npm = coulps[i].npm;
      break;
    }
  }

  return npm;
};
