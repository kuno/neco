var fs = require('fs'),
path = require('path'),
cmdList = require('../include/default.js').cmdList,
forbiddenWords = require('../include/default.js').forbiddenWords,
pkgDir = path.join(__dirname, '..'),
root = process.env.NECO_ROOT,
recordFile = path.join(root, '.neco/record.json');

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

exports.virgin = function(callback) {
  if (process.env.NECO_ROOT === undefined) {
    console.log('It\'s seems that you have not setup NECO_ROOT environment viriable!');
    console.log('add \'export NECO_ROOT=<path>\' into your shell config file.');
  } else if (process.env.NODE_ECOSYSTEM !== undefined) {
  } else {
    callback();
  }
};

exports.inception = function(cmd, run) {
  var rf = recordFile;
  path.exists(rf, function(exists) {
    if (!exists) {
      console.log('You have not create any node ecosystem.');
      console.log('Use nc create command to create first one!');
    }
    run(exists);
  });
};

exports.getSuitedNPM = function(version) {
  var suited = false;
  var target = version.split('.');

  var npmPkgFile = path.join(pkgDir, 'deps/npm/package.json');
  var npmPkg = JSON.parse(fs.readFileSync(npmPkgFile, 'utf8'));
  var npmVer = npmPkg.version; 
  var node = npmPkg.engines.node;
  var mini = node.slice(2, node.length).split('.');

  var len = (target.length <= mini.length) ? target.length : mini.length;
  for (var i = 0; i < len; ++i) {
    if (parseInt(target[i], 10) > parseInt(mini[i], 10)) {
      suited = true;
      break;
    } else if (i === len - 1) {
      if (target.len > mini.length) {
        suited = true;
      }
    }
  }

  if (suited) {
    return npmVer;
  } else {
    return false;
  }
};
