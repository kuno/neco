var os = require('os'),
    fs = require('fs'),
    path = require('path'),
    cmdList = require('../include/default.js').cmdList,
    log  = require('./console.js').log,
    forbiddenWords = require('../include/default.js').forbiddenWords;
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

exports.getSuitedNPM = function(config) {
  var len, minima, npm = null;
  var target = config.release.version;
  var notSmaller = exports.compareVersions;

  var dataFile = path.join(config.pkgDir, 'data/npm.json');
  var coulps = JSON.parse(fs.readFileSync(dataFile, 'utf8')).coulps;
  len = coulps.length;

  for (var i = 0; i < len; ++i) {
    minima = coulps[i].node;
    if (notSmaller(target, minima) >= 0) {
      npm = coulps[i].npm;
      break;
    }
  }

  return npm;
};

exports.getNodeInstallScript = function(config) {
  var script;
  var type = os.type(), release = os.release();

  switch (type)
  {
    case 'Linux':
    if (release.match(/arch|ARCH/)) {
      script = path.join(config.shellDir, 'install_node/linux/arch.sh');
    } else {
      script = path.join(config.shellDir, 'install_node/linux/default.sh');
    }
    break;

    case 'OSX':
    break;

    case 'Windows':
    break;

    default:
    script = path.join(config.shellDir, 'install_node/default.sh');
    break;
  }

  return script;
};

exports.getNPMInstallScript = function(config) {
  var script = path.join(config.shellDir, 'install_npm.sh');

  return script;
};

exports.getActivateInstallScript = function(config) {
  var script = path.join(config.shellDir, 'install_activate.sh');

  return script;
};

exports.writeConfigFile = function(config) {
  var configFile = path.join(config.root, '.neco', config.id, 'config');
  var configStr = JSON.stringify(config);   

  fs.writeFile(configFile, configStr, 'utf8', function(err) {
    if (err) {throw err;}
  });
};

exports.getDateTime = function(config) {
  var date = new Date(), time = date.getTime();
  if (config.timeFormat === 'GMT') {
    time = date.toGMTString(time);
  } else if (config.timeFormat === 'ISO') {
    tiime = date.toISOString(time);
  } else if (config.timeFormat === 'UTC') {
    time = date.toUTCString(time);
  } else if (config.timeFormat === 'date') {
    time = date.toDateString(time);
  } else {
    time = date.toTimeString(time);
  }

  return time;
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
