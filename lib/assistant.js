var os = require('os'),
    fs = require('fs'),
    path = require('path'),
    log  = require('./display.js').log,
    notSmaller = require('./utils.js').compareVersions,
    cleanGloalConfig = require('./utils.js').cleanGloalConfig,
    cleanEcosystemConfig = require('./utils.js').cleanEcosystemConfig;
var message, warning, error, suggestion, example;

exports.getRelease = function(config) {
  var dist, distFile,ver, release, target;
  target = config.target;
  distFile = config.distFile;
  dist = JSON.parse(fs.readFileSync(distFile, 'utf8'));

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

exports.getEcosystem = function(config) {
  var target = config.target, ecosystem = null;
  var ecosystems = fs.readFileSync(config.readFile, 'utf8').ecosystems;

  ecosystems.forEach(function(e) {
    if (e.id === target) {
      ecosystem = e;
      return ecosystem;
    }
  });

};

exports.getSuitedNPM = function(config) {
  var len, minima, npm = null;
  var target = config.release.version;

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

exports.writeConfigFiles = function(config) {
  var configFile = path.join(config.root, '.neco', 'config.json');
  var ecosystemConfigFile = path.join(config.root, '.neco', config.id, 'config.json');
  var configStr;

  if (config.id.length > config.idLenStandard) {
    config.idLenStandard = config.id.length;
  }

  config = cleanGloalConfig(config);
  configStr = JSON.stringify(config);

  fs.writeFile(ecosystemConfigFile, configStr, 'utf8', function(err) {
    if (err) {throw err;}
    config = cleanEcosystemConfig(config);
    configStr = JSON.stringify(config);
    fs.writeFile(configFile, configStr, 'utf8', function(err) {
      if (err) {throw err;}
    });
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
